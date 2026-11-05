#!/usr/bin/env sh
# Postgres entrypoint wrapper — migrates old pgdata named volume to bind mount
# on first start, then hands off to the real postgres entrypoint.

DATA_DIR="/var/lib/postgresql/data"
OLD_DIR="/old-pgdata"

if [ -d "$OLD_DIR" ] && [ -n "$(ls -A "$OLD_DIR" 2>/dev/null)" ]; then
  if [ -z "$(ls -A "$DATA_DIR" 2>/dev/null)" ]; then
    echo "[pg-entrypoint] Migrating old named volume data to bind mount..."
    cp -a "$OLD_DIR/." "$DATA_DIR/"
    echo "[pg-entrypoint] Migration complete. Old volume data will no longer be used."
  else
    echo "[pg-entrypoint] Bind mount already has data, skipping migration."
  fi
fi

exec docker-entrypoint.sh "$@"
