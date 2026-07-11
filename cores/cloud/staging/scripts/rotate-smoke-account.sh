#!/usr/bin/env bash
# Rotation du compte smoke staging — nouveau mot de passe aléatoire, jamais stocké
# Usage: bash rotate-smoke-account.sh <env-file> <smoke-account-email>
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: bash rotate-smoke-account.sh <env-file> <smoke-account-email>" >&2
  exit 2
fi

ENV_FILE="$1"
SMOKE_EMAIL="$2"
COMPOSE_DIR=$(dirname "$ENV_FILE")

if [ ! -f "$ENV_FILE" ]; then echo "ERROR: $ENV_FILE not found" >&2; exit 1; fi

docker compose --env-file "$ENV_FILE" -f "${COMPOSE_DIR}/docker-compose.yml" \
  run --rm --workdir /app -e "SMOKE_EMAIL=${SMOKE_EMAIL}" api node -e "
const { PrismaClient } = require('@prisma/client');
const { hash } = require('@node-rs/argon2');
const crypto = require('crypto');
const prisma = new PrismaClient();
const email = process.env.SMOKE_EMAIL;
if (!email) {
  throw new Error('SMOKE_EMAIL is required');
}
const newPass = crypto.randomBytes(32).toString('base64url');
const m = parseInt(process.env.ARGON2_MEMORY_COST || '65536');
const t = parseInt(process.env.ARGON2_TIME_COST || '3');
const p = parseInt(process.env.ARGON2_PARALLELISM || '1');
hash(newPass, { memoryCost: m, timeCost: t, parallelism: p })
  .then(h => prisma.user.update({ where: { email }, data: { passwordHash: h } }))
  .then(() => { console.log('Rotation OK — nouveau mot de passe généré et écarté.'); })
  .finally(() => prisma.\$disconnect());
"

echo "Compte smoke staging : mot de passe tourné (valeur non conservée)."
