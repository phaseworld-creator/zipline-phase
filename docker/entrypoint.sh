#!/usr/bin/env sh
set -e

cd ${ZIPLINE_ROOT:-/zipline}

echo "[entrypoint] Running database migrations..."
DATABASE_URL="${DATABASE_URL}" pnpm prisma migrate deploy || {
  echo "[entrypoint] WARNING: Migration failed, attempting to add missing column directly..."
  
  # Extract connection details from DATABASE_URL
  DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
  
  echo "[entrypoint] Attempting direct database fix..."
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "ALTER TABLE \"File\" ADD COLUMN IF NOT EXISTS \"encrypted\" BOOLEAN NOT NULL DEFAULT false;" || {
    echo "[entrypoint] Direct database fix also failed, continuing anyway..."
  }
}

echo "[entrypoint] Starting Zipline server..."
exec node --enable-source-maps build/server/index.js
