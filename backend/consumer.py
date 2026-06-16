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
    "aftercare": "mytrees_aftercare",
    "apiary_assessment": "mytrees_apiary_assessment",
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


def seed_postgres_from_sqlite(postgres_conn):
    """Seed Postgres database from local SQLite database if Postgres tables are empty."""
    db_path = os.path.join(backend_dir, "mytrees_synced.db")
    if not os.path.exists(db_path):
        logger.warning(f"[Seeder] Local SQLite database not found at {db_path}. Skipping seed.")
        return

    logger.info(f"[Seeder] SQLite database found at {db_path}. Checking Postgres tables for seeding...")
    try:
        sqlite_conn = sqlite3.connect(db_path)
        sqlite_cur = sqlite_conn.cursor()
        
        # Get list of tables in SQLite
        sqlite_cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        sqlite_tables = [t[0] for t in sqlite_cur.fetchall()]
        
        postgres_cur = postgres_conn.cursor()
        
        # We want to seed tables defined in LAYER_TO_TABLE values
        tables_to_seed = sorted(list(set(LAYER_TO_TABLE.values())))
        
        for table_name in tables_to_seed:
            if table_name not in sqlite_tables:
                continue
                
            # Check if Postgres table is empty
            postgres_cur.execute(f"SELECT COUNT(*) FROM {table_name}")
            pg_count = postgres_cur.fetchone()[0]
            
            if pg_count == 0:
                logger.info(f"[Seeder] Postgres table '{table_name}' is empty. Fetching from SQLite...")
                sqlite_cur.execute(f"SELECT id, fid, geometry, properties FROM {table_name}")
                rows = sqlite_cur.fetchall()
                if rows:
                    logger.info(f"[Seeder] Seeding {len(rows)} records into Postgres table '{table_name}'...")
                    prepared_rows = []
                    for row_id, fid, geom_json, props_json in rows:
                        geom_obj = json.loads(geom_json) if geom_json else None
                        props_obj = json.loads(props_json) if props_json else {}
                        prepared_rows.append((row_id, fid, json.dumps(geom_obj) if geom_obj else None, json.dumps(props_obj)))
                    
                    insert_query = f"""
                        INSERT INTO {table_name} (id, fid, geometry, properties)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (id) DO NOTHING;
                    """
                    postgres_cur.executemany(insert_query, prepared_rows)
                    postgres_conn.commit()
                    logger.info(f"[Seeder] Successfully seeded '{table_name}'.")
                else:
                    logger.info(f"[Seeder] SQLite table '{table_name}' is empty. Nothing to seed.")
            else:
                logger.info(f"[Seeder] Postgres table '{table_name}' already contains {pg_count} records. Skipping.")
                
        sqlite_conn.close()
        logger.info("[Seeder] Finished checking and seeding Postgres tables.")
    except Exception as e:
        logger.error(f"[Seeder] Error during PostgreSQL seeding: {e}", exc_info=True)


def main():
    """
    Kafka consumer loop. Safe to run as a background daemon thread inside FastAPI.
    Will NOT call sys.exit() — any failure is logged and the thread exits quietly.
    """
    try:
        conn, db_type = get_db_connection()
        init_db(conn, db_type)
        if db_type == "postgres":
            seed_postgres_from_sqlite(conn)
    except Exception as e:
        logger.error(f"[Consumer] Failed to connect to database: {e} — consumer thread will exit.")
        return

    # Build Kafka config inside main() so import-time errors can't crash the web server
    try:
        from main import _ensure_kafka_certs, KAFKA_BOOTSTRAP_SERVERS
        ca_path, cert_path, key_path = _ensure_kafka_certs()
        
        # Use different consumer group IDs to avoid local partition stealing from production.
        # Use a fresh group ID suffix for production to force Kafka to rebuild missing/empty tables on restart.
        group_id = 'mytrees-db-syncer-group-prod-v4' if db_type == "postgres" else 'mytrees-db-syncer-group-local'
        logger.info(f"[Consumer] Selected consumer group.id: '{group_id}'")
        
        kafka_conf = {
            'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS,
            'security.protocol': 'SSL',
            'ssl.ca.location': ca_path,
            'ssl.certificate.location': cert_path,
            'ssl.key.location': key_path,
            'group.id': group_id,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': True
        }
    except Exception as e:
        logger.error(f"[Consumer] Failed to build Kafka SSL config: {e} — consumer thread will exit.")
        conn.close()
        return  # safe exit, web server keeps running

    logger.info("[Consumer] Kafka consumer starting — subscribing to topics...")
    consumer = Consumer(kafka_conf)
    consumer.subscribe(TOPICS)

    try:
        uncommitted = 0
        while True:
            msg = consumer.poll(timeout=1.0)
            if msg is None:
                if uncommitted > 0:
                    try:
                        conn.commit()
                        logger.info(f"[Consumer] Committed batch of {uncommitted} records to database.")
                    except Exception as commit_err:
                        logger.error(f"[Consumer] Commit failed: {commit_err}")
                    uncommitted = 0
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
                    uncommitted += 1
                    if uncommitted >= 500:
                        try:
                            conn.commit()
                            logger.info(f"[Consumer] Committed batch of {uncommitted} records to database.")
                        except Exception as commit_err:
                            logger.error(f"[Consumer] Commit failed: {commit_err}")
                        uncommitted = 0
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
