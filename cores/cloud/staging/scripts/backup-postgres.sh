#!/usr/bin/env bash
# Backup PostgreSQL staging — hors dépôt, credentials non loggués
# Usage: bash backup-postgres.sh [env-file] [dest-dir]
set -euo pipefail

ENV_FILE="${1:-/home/deploy/enistere-staging/.env.staging}"
DEST_DIR="${2:-/home/deploy/backups}"
TIMESTAMP=$(date +%Y%m%dT%H%M%S)
BACKUP_FILE="${DEST_DIR}/staging-pg-${TIMESTAMP}.sql.gz"

if [ ! -f "$ENV_FILE" ]; then echo "ERROR: $ENV_FILE not found" >&2; exit 1; fi

PG_USER=$(grep '^POSTGRES_USER=' "$ENV_FILE" | cut -d= -f2-)
PG_DB=$(grep '^POSTGRES_DB=' "$ENV_FILE" | cut -d= -f2-)

if [ -z "$PG_USER" ] || [ -z "$PG_DB" ]; then
  echo "ERROR: POSTGRES_USER or POSTGRES_DB missing in $ENV_FILE" >&2; exit 1
fi

mkdir -p "$DEST_DIR"

# Backup via pg_dump (conteneur postgres en cours d'exécution)
docker exec enistere-staging-postgres-1 pg_dump -U "$PG_USER" "$PG_DB" | gzip > "$BACKUP_FILE"
chmod 600 "$BACKUP_FILE"

echo "Backup OK: $BACKUP_FILE ($(du -sh "$BACKUP_FILE" | cut -f1))"
