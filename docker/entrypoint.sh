#!/usr/bin/env sh
set -e

cd ${ZIPLINE_ROOT:-/zipline}

# ── Safety check ────────────────────────────────────────────────────────────
# If the uploads directory has files but the database has NO users, something
# went wrong (e.g. the user accidentally ran `docker compose down -v`).
# Refuse to start so data isn't silently lost or overwritten.
if [ -d "./uploads" ] && [ "$(ls -A ./uploads 2>/dev/null | grep -v '\.tmp' | head -1)" ]; then
  USER_COUNT=$(DATABASE_URL="${DATABASE_URL}" node -e "
    const { PrismaClient } = require('./src/prisma');
    const p = new PrismaClient();
    p.user.count().then(n => { process.stdout.write(String(n)); p.\$disconnect(); }).catch(() => process.stdout.write('0'));
  " 2>/dev/null || echo "0")

  if [ "$USER_COUNT" = "0" ]; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║  ⚠  ZIPLINE SAFETY STOP                                         ║"
    echo "║                                                                  ║"
    echo "║  The uploads/ folder contains files but the database has no     ║"
    echo "║  users. This usually means the database volume was wiped.       ║"
    echo "║                                                                  ║"
    echo "║  To prevent data loss, Zipline will NOT start.                  ║"
    echo "║                                                                  ║"
    echo "║  Options:                                                        ║"
    echo "║   1. Restore from a backup:                                      ║"
    echo "║      gunzip -c backups/zipline_db_XXXX.sql.gz |                  ║"
    echo "║        docker compose exec -T postgresql psql -U zipline zipline ║"
    echo "║                                                                  ║"
    echo "║   2. If this is a fresh install, delete the uploads/ folder     ║"
    echo "║      or set ZIPLINE_SKIP_SAFETY_CHECK=1 to bypass this check.   ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""

    if [ "${ZIPLINE_SKIP_SAFETY_CHECK}" = "1" ]; then
      echo "[entrypoint] ZIPLINE_SKIP_SAFETY_CHECK=1 set, proceeding anyway..."
    else
      exit 1
    fi
  fi
fi

# ── Migrations ───────────────────────────────────────────────────────────────
echo "[entrypoint] Running database migrations..."
DATABASE_URL="${DATABASE_URL}" pnpm prisma migrate deploy || {
  echo "[entrypoint] WARNING: Migration failed, attempting to fix database schema directly..."
  
  DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
  
  echo "[entrypoint] Adding missing columns to File table..."
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" <<-EOSQL
		ALTER TABLE "File" ADD COLUMN IF NOT EXISTS "encrypted" BOOLEAN NOT NULL DEFAULT false;
		ALTER TABLE "File" ADD COLUMN IF NOT EXISTS "oneTimeView" BOOLEAN NOT NULL DEFAULT false;
	EOSQL
  
  if [ $? -eq 0 ]; then
    echo "[entrypoint] Successfully added missing columns!"
  else
    echo "[entrypoint] Failed to add columns, server may have errors..."
  fi
}

echo "[entrypoint] Starting Zipline server..."
exec node --enable-source-maps build/server/index.js
