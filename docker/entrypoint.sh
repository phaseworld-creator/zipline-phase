#!/usr/bin/env sh
set -e

cd ${ZIPLINE_ROOT:-/zipline}

echo "[entrypoint] Running database migrations..."
pnpm prisma migrate deploy || {
  echo "[entrypoint] WARNING: Migration failed, but continuing startup..."
  echo "[entrypoint] The server will start but may encounter database errors."
}

echo "[entrypoint] Starting Zipline server..."
exec node --enable-source-maps build/server/index.js
