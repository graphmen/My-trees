import os
import sys
import json
import logging
import sqlite3
from datetime import datetime
from confluent_kafka import Consumer, KafkaError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kafka-consumer")

# Reuse cert generation from main backend
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)
from main import _ensure_kafka_certs, KAFKA_BOOTSTRAP_SERVERS

# Database Connection URL (e.g. postgresql://user:pass@host:port/db)
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Kafka Connection Setup
try:
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
    logger.error(f"Failed to prepare Kafka SSL configurations: {e}")
    sys.exit(1)

# Topics mappings
TOPICS = [
    "mytrees-meetings",
    "mytrees-verifications",
    "mytrees-plantings",
    "mytrees-survival",
    "mytrees-fires",
    "mytrees-beekeeping"
]

def get_db_connection():
    """Returns database connection and connection type ('postgres' or 'sqlite')."""
    if DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://"):
        import psycopg2
        logger.info("Connecting to PostgreSQL database...")
        conn = psycopg2.connect(DATABASE_URL)
        return conn, "postgres"
    else:
        # Local SQLite database fallback
        db_path = os.path.join(backend_dir, "mytrees_synced.db")
        logger.info(f"Connecting to fallback SQLite database at {db_path}...")
        conn = sqlite3.connect(db_path)
        return conn, "sqlite"

def init_db(conn, db_type):
    """Auto-creates tables for each topic with optimized JSON/JSONB layout."""
    cursor = conn.cursor()
    for topic in TOPICS:
        # Standardize table name: replace hyphens with underscores
        table_name = topic.replace("-", "_")
        
        if db_type == "postgres":
            # PostgreSQL optimized schema with JSONB support
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
            # SQLite schema
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
    """UPSERTs data record payload dynamically into the corresponding table."""
    table_name = topic.replace("-", "_")
    data_dict = payload.get("data", {})
    
    # Extract structural details
    fid = str(data_dict.get("fid", ""))
    geom = data_dict.get("geometry")
    
    # Separate other columns from geometry
    properties = {k: v for k, v in data_dict.items() if k != "geometry"}
    
    cursor = conn.cursor()
    if db_type == "postgres":
        # UPSERT for PostgreSQL
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
        # UPSERT for SQLite
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
    logger.info(f"Upserted record {msg_key} into database table {table_name}.")

def main():
    conn, db_type = get_db_connection()
    init_db(conn, db_type)
    
    logger.info("Initializing Kafka Consumer client...")
    consumer = Consumer(kafka_conf)
    consumer.subscribe(TOPICS)
    
    logger.info("Starting ingestion loop...")
    try:
        while True:
            msg = consumer.poll(timeout=1.0)
            if msg is None:
                continue
            
            if msg.error():
                if msg.error().code() != KafkaError._PARTITION_EOF:
                    logger.error(f"Kafka error: {msg.error()}")
                continue
            
            try:
                msg_key = msg.key().decode('utf-8') if msg.key() else f"auto_{msg.offset()}"
                payload = json.loads(msg.value().decode('utf-8'))
                
                # Check if it's a data record event
                if payload.get("event") == "data.record":
                    save_record(conn, db_type, msg.topic(), msg_key, payload)
            except Exception as e:
                logger.error(f"Error processing message from topic {msg.topic()}: {e}", exc_info=True)
                
    except KeyboardInterrupt:
        logger.info("Shutting down consumer worker...")
    finally:
        consumer.close()
        conn.close()
        logger.info("Syncer worker exited.")

if __name__ == "__main__":
    main()
