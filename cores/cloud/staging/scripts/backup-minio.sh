#!/usr/bin/env bash
# Backup MinIO staging — hors dépôt, credentials non loggués
# Usage: bash backup-minio.sh [env-file] [dest-dir]
set -euo pipefail

ENV_FILE="${1:-/home/deploy/enistere-staging/.env.staging}"
DEST_DIR="${2:-/home/deploy/backups/minio}"
NETWORK="enistere-staging_staging-internal"

if [ ! -f "$ENV_FILE" ]; then echo "ERROR: $ENV_FILE not found" >&2; exit 1; fi

MINIO_USER=$(grep '^MINIO_ROOT_USER=' "$ENV_FILE" | cut -d= -f2-)
MINIO_PASS=$(grep '^MINIO_ROOT_PASSWORD=' "$ENV_FILE" | cut -d= -f2-)
S3_BUCKET=$(grep '^S3_BUCKET=' "$ENV_FILE" | cut -d= -f2-)

if [ -z "$MINIO_USER" ] || [ -z "$MINIO_PASS" ] || [ -z "$S3_BUCKET" ]; then
  echo "ERROR: MINIO_ROOT_USER, MINIO_ROOT_PASSWORD or S3_BUCKET missing" >&2; exit 1
fi

mkdir -p "$DEST_DIR"

docker run --rm \
  --network "$NETWORK" \
  -v "${DEST_DIR}:/minio-backup" \
  -e "MC_HOST_s3=http://${MINIO_USER}:${MINIO_PASS}@minio:9000" \
  minio/mc mirror --overwrite "s3/${S3_BUCKET}" /minio-backup

COUNT=$(find "$DEST_DIR" -type f | wc -l)
echo "Backup OK: $DEST_DIR ($COUNT fichiers)"
