#!/usr/bin/env sh
set -e

cd ${ZIPLINE_ROOT:-/zipline}

# ── Auto-migrate named volume → bind mount ───────────────────────────────────
# If ./data/postgres is empty but the old named volume (pgdata) exists and has
# data, copy it over automatically so existing installs don't lose anything.
DATA_DIR="/zipline-data/postgres"
if [ -d "$DATA_DIR" ] && [ -z "$(ls -A "$DATA_DIR" 2>/dev/null)" ]; then
  # Bind mount exists but is empty — check if the old named volume is mounted
  # Docker mounts the named volume at a predictable path when both are declared.
  # We detect it by checking common Postgres volume paths inside the container.
  for OLD_PATH in \
    "/var/lib/postgresql/data-old" \
    "/pgdata-migrate" \
    "/old-pgdata"; do
    if [ -d "$OLD_PATH" ] && [ -n "$(ls -A "$OLD_PATH" 2>/dev/null)" ]; then
      echo "[entrypoint] Detected existing named volume data at ${OLD_PATH}"
      echo "[entrypoint] Auto-migrating to bind mount at ${DATA_DIR}..."
      cp -a "$OLD_PATH/." "$DATA_DIR/"
      echo "[entrypoint] Migration complete."
      break
    fi
  done
fi

# ── Safety check ─────────────────────────────────────────────────────────────
# If uploads/ has files but the database Zipline row count is 0, something went
# wrong (e.g. accidental `docker compose down -v`). Refuse to start so data
# isn't silently lost. Set ZIPLINE_SKIP_SAFETY_CHECK=1 to bypass.
if [ -d "./uploads" ] && [ -n "$(ls -A ./uploads 2>/dev/null | grep -v '\.tmp' | head -1)" ]; then
  # Try a quick DB ping to count users
  USER_COUNT=$(DATABASE_URL="${DATABASE_URL}" node -e "
    try {
      const { PrismaClient } = require('./src/prisma');
      const p = new PrismaClient();
      p.user.count()
        .then(n => { process.stdout.write(String(n)); return p.\$disconnect(); })
        .catch(() => { process.stdout.write('skip'); });
    } catch(e) { process.stdout.write('skip'); }
  " 2>/dev/null || echo "skip")

  if [ "$USER_COUNT" = "0" ]; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║  ⚠  ZIPLINE SAFETY STOP                                         ║"
    echo "║                                                                  ║"
    echo "║  The uploads/ folder has files but the database has no users.   ║"
    echo "║  This usually means the database volume was accidentally wiped. ║"
    echo "║                                                                  ║"
    echo "║  To restore from a backup:                                       ║"
    echo "║    gunzip -c backups/zipline_db_LATEST.sql.gz | \\               ║"
    echo "║      docker compose exec -T postgresql \\                        ║"
    echo "║        psql -U zipline zipline                                   ║"
    echo "║                                                                  ║"
    echo "║  Fresh install with no prior data? Set:                         ║"
    echo "║    ZIPLINE_SKIP_SAFETY_CHECK=1  in your .env                    ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""

    if [ "${ZIPLINE_SKIP_SAFETY_CHECK}" = "1" ]; then
      echo "[entrypoint] ZIPLINE_SKIP_SAFETY_CHECK=1 — proceeding anyway."
    else
      exit 1
    fi
  fi
fi

# ── Migrations ───────────────────────────────────────────────────────────────
echo "[entrypoint] Running database migrations..."
DATABASE_URL="${DATABASE_URL}" pnpm prisma migrate deploy || {
  echo "[entrypoint] WARNING: Migration failed, attempting direct schema fix..."

  DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

  echo "[entrypoint] Adding missing columns..."
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" <<-EOSQL
		ALTER TABLE "File" ADD COLUMN IF NOT EXISTS "encrypted" BOOLEAN NOT NULL DEFAULT false;
		ALTER TABLE "File" ADD COLUMN IF NOT EXISTS "oneTimeView" BOOLEAN NOT NULL DEFAULT false;
	EOSQL

  if [ $? -eq 0 ]; then
    echo "[entrypoint] Schema fix applied."
  else
    echo "[entrypoint] Schema fix failed — server may have errors."
  fi
}

echo "[entrypoint] Starting Zipline server..."
exec node --enable-source-maps build/server/index.js
