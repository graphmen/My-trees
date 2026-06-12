import os
import sys
import json
import logging
import sqlite3
from confluent_kafka import Consumer, KafkaError

logger = logging.getLogger("kafka-consumer")

# Reuse cert generation from main backend
backend_dir = os.path.dirname(os.path.abspath(__file__))

# Topics to subscribe to
TOPICS = [
    "mytrees-meetings",
    "mytrees-verifications",
    "mytrees-plantings",
    "mytrees-survival",
    "mytrees-fires",
    "mytrees-beekeeping"
]

# Map canonical layer names (from payload.get("layer")) to database table names.
# Fallback to topic name mapping if "layer" is not present in the payload.
LAYER_TO_TABLE = {
    "meetings": "mytrees_meetings",
    "verification": "mytrees_verification",
    "planting": "mytrees_planting",
    "survival_count": "mytrees_survival_count",
    "fires": "mytrees_fires",
    "beekeeping": "mytrees_beekeeping",
    "plots_mapping": "mytrees_plots_mapping",
    "nurseries": "mytrees_nurseries",
    "user_tracks": "mytrees_user_tracks",
    "plot_selection": "mytrees_plot_selection",
    "plots_assessment": "mytrees_plots_assessment",
    "land_preparation": "mytrees_land_preparation",
    "seed_collection": "mytrees_seed_collection",
    "seed_bank": "mytrees_seed_bank",
    "nurseries_verification": "mytrees_nurseries_verification",
    # Backward compatibility mappings for old topic-style payloads
    "mytrees-meetings": "mytrees_meetings",
    "mytrees-verifications": "mytrees_verification",
    "mytrees-plantings": "mytrees_planting",
    "mytrees-survival": "mytrees_survival_count",
    "mytrees-fires": "mytrees_fires",
    "mytrees-beekeeping": "mytrees_beekeeping"
}


def get_db_connection():
    """Returns database connection and connection type ('postgres' or 'sqlite')."""
    DATABASE_URL = os.getenv("DATABASE_URL", "")
    if DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://"):
        import psycopg2
        logger.info("Connecting to PostgreSQL database...")
        conn = psycopg2.connect(DATABASE_URL)
        return conn, "postgres"
    else:
        db_path = os.path.join(backend_dir, "mytrees_synced.db")
        logger.info(f"Connecting to fallback SQLite database at {db_path}...")
        conn = sqlite3.connect(db_path)
        return conn, "sqlite"


def init_db(conn, db_type):
    """Auto-creates tables for all layers."""
    cursor = conn.cursor()
    # Create all unique tables from LAYER_TO_TABLE values
    tables_to_create = sorted(list(set(LAYER_TO_TABLE.values())))
    for table_name in tables_to_create:
        if db_type == "postgres":
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id VARCHAR(255) PRIMARY KEY,
                    fid VARCHAR(255),
                    geometry JSONB,
                    properties JSONB,
                    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """)
        else:
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS {table_name} (
                    id TEXT PRIMARY KEY,
                    fid TEXT,
                    geometry TEXT,
                    properties TEXT,
                    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
    conn.commit()
    logger.info("Database schemas initialized.")


def save_record(conn, db_type, topic, msg_key, payload):
    """UPSERTs a data record into the corresponding table."""
    layer_name = payload.get("layer")
    if layer_name in LAYER_TO_TABLE:
        table_name = LAYER_TO_TABLE[layer_name]
    else:
        table_name = LAYER_TO_TABLE.get(topic, topic.replace("-", "_"))

    data_dict = payload.get("data", {})
    fid = str(data_dict.get("fid", ""))
    geom = data_dict.get("geometry")
    properties = {k: v for k, v in data_dict.items() if k != "geometry"}

    cursor = conn.cursor()
    if db_type == "postgres":
        query = f"""
            INSERT INTO {table_name} (id, fid, geometry, properties)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                fid = EXCLUDED.fid,
                geometry = EXCLUDED.geometry,
                properties = EXCLUDED.properties,
                synced_at = CURRENT_TIMESTAMP;
        """
        cursor.execute(
            query,
            (msg_key, fid, json.dumps(geom) if geom else None, json.dumps(properties))
        )
    else:
        query = f"""
            INSERT INTO {table_name} (id, fid, geometry, properties)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                fid = excluded.fid,
                geometry = excluded.geometry,
                properties = excluded.properties,
                synced_at = CURRENT_TIMESTAMP;
        """
        cursor.execute(
            query,
            (msg_key, fid, json.dumps(geom) if geom else None, json.dumps(properties))
        )
    conn.commit()
    logger.info(f"Upserted record {msg_key} into {table_name}.")


def main():
    """
    Kafka consumer loop. Safe to run as a background daemon thread inside FastAPI.
    Will NOT call sys.exit() — any failure is logged and the thread exits quietly.
    """
    # Build Kafka config inside main() so import-time errors can't crash the web server
    try:
        from main import _ensure_kafka_certs, KAFKA_BOOTSTRAP_SERVERS
        ca_path, cert_path, key_path = _ensure_kafka_certs()
        kafka_conf = {
            'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
            'security.protocol': 'SSL',
            'ssl.ca.location': ca_path,
            'ssl.certificate.location': cert_path,
            'ssl.key.location': key_path,
            'group.id': 'mytrees-db-syncer-group',
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': True
        }
    except Exception as e:
        logger.error(f"[Consumer] Failed to build Kafka SSL config: {e} — consumer thread will exit.")
        return  # safe exit, web server keeps running

    try:
        conn, db_type = get_db_connection()
        init_db(conn, db_type)
    except Exception as e:
        logger.error(f"[Consumer] Failed to connect to database: {e} — consumer thread will exit.")
        return

    logger.info("[Consumer] Kafka consumer starting — subscribing to topics...")
    consumer = Consumer(kafka_conf)
    consumer.subscribe(TOPICS)

    try:
        while True:
            msg = consumer.poll(timeout=1.0)
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() != KafkaError._PARTITION_EOF:
                    logger.error(f"[Consumer] Kafka error: {msg.error()}")
                continue
            try:
                msg_key = msg.key().decode('utf-8') if msg.key() else f"auto_{msg.offset()}"
                payload = json.loads(msg.value().decode('utf-8'))
                if payload.get("event") == "data.record":
                    save_record(conn, db_type, msg.topic(), msg_key, payload)
            except Exception as e:
                logger.error(f"[Consumer] Error processing message: {e}", exc_info=True)
    except Exception as e:
        logger.error(f"[Consumer] Consumer loop crashed: {e}", exc_info=True)
    finally:
        consumer.close()
        conn.close()
        logger.info("[Consumer] Consumer thread exited.")


if __name__ == "__main__":
    # Allow running standalone for testing: python consumer.py
    logging.basicConfig(level=logging.INFO)
    main()
