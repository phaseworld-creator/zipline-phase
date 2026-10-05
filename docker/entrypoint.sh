#!/usr/bin/env sh
set -e

cd ${ZIPLINE_ROOT:-/zipline}

echo "[entrypoint] Running database migrations..."
DATABASE_URL="${DATABASE_URL}" pnpm prisma migrate deploy || {
  echo "[entrypoint] WARNING: Migration failed, attempting to fix database schema directly..."
  
  # Extract connection details from DATABASE_URL
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
