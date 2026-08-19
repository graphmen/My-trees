"""Apply supabase/schema.sql using DATABASE_URL from backend/.env. Do not print secrets."""
import os
from pathlib import Path

def load_env(path: Path):
    if not path.is_file():
        raise SystemExit("backend/.env is missing")
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))

root = Path(__file__).resolve().parent
load_env(root / ".env")
url = os.environ.get("DATABASE_URL", "")
if not url:
    raise SystemExit("DATABASE_URL is not set")
if "sslmode=" not in url:
    url += ("&" if "?" in url else "?") + "sslmode=require"

import psycopg2

schema = (root.parent / "supabase" / "schema.sql").read_text(encoding="utf-8")
print("Connecting to Supabase Postgres...")
conn = psycopg2.connect(url, connect_timeout=20)
conn.autocommit = True
cur = conn.cursor()
cur.execute(schema)
cur.execute(
    """
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename LIKE 'mytrees_%'
    ORDER BY tablename
    """
)
tables = [row[0] for row in cur.fetchall()]
cur.close()
conn.close()
print(f"Schema applied. {len(tables)} mytrees_* tables ready.")
for name in tables:
    print(f"  {name}")
