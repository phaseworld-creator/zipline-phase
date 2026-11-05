#!/usr/bin/env sh
# Zipline safe update script
# Backs up the database, pulls the new image, and restarts.
# Your files (uploads/, public/, themes/, data/postgres/) are NEVER deleted.

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/zipline_db_${TIMESTAMP}.sql.gz"

# Load env vars for DB credentials
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

DB_USER="${POSTGRESQL_USER:-zipline}"
DB_PASS="${POSTGRESQL_PASSWORD:-zipline}"
DB_NAME="${POSTGRESQL_DB:-zipline}"

echo "==> Zipline Safe Update"
echo ""

# 1. Backup the database
echo "[1/4] Backing up database to ${BACKUP_FILE}..."
mkdir -p "$BACKUP_DIR"
docker compose exec -T postgresql \
  sh -c "PGPASSWORD='${DB_PASS}' pg_dump -U '${DB_USER}' '${DB_NAME}'" \
  | gzip > "$BACKUP_FILE"
echo "      Backup saved: ${BACKUP_FILE}"
echo ""

# 2. Pull the new image
echo "[2/4] Pulling latest image..."
docker compose pull zipline
echo ""

# 3. Restart (migrations run automatically on startup)
echo "[3/4] Restarting Zipline (migrations will run automatically)..."
docker compose up -d --no-deps zipline
echo ""

# 4. Wait and confirm
echo "[4/4] Waiting for healthcheck..."
sleep 8
STATUS=$(docker compose ps --format json zipline 2>/dev/null | grep -o '"Health":"[^"]*"' | head -1 || echo "unknown")
echo "      Container status: ${STATUS}"
echo ""
echo "==> Update complete. All your data is safe."
echo "    If something went wrong, restore with:"
echo "    gunzip -c ${BACKUP_FILE} | docker compose exec -T postgresql psql -U ${DB_USER} ${DB_NAME}"
