#!/usr/bin/env bash
# Rotation du compte smoke staging — nouveau mot de passe aléatoire, jamais stocké
# Usage: bash rotate-smoke-account.sh [env-file] [email]
# L'email par défaut est admin@enistere-staging.local
set -euo pipefail

ENV_FILE="${1:-/home/deploy/enistere-staging/.env.staging}"
SMOKE_EMAIL="${2:-admin@enistere-staging.local}"
COMPOSE_DIR=$(dirname "$ENV_FILE")

if [ ! -f "$ENV_FILE" ]; then echo "ERROR: $ENV_FILE not found" >&2; exit 1; fi

docker compose --env-file "$ENV_FILE" -f "${COMPOSE_DIR}/docker-compose.yml" \
  run --rm --workdir /app api node -e "
const { PrismaClient } = require('@prisma/client');
const { hash } = require('@node-rs/argon2');
const crypto = require('crypto');
const prisma = new PrismaClient();
const email = process.env.SMOKE_EMAIL || 'admin@enistere-staging.local';
const newPass = crypto.randomBytes(32).toString('base64url');
const m = parseInt(process.env.ARGON2_MEMORY_COST || '65536');
const t = parseInt(process.env.ARGON2_TIME_COST || '3');
const p = parseInt(process.env.ARGON2_PARALLELISM || '1');
hash(newPass, { memoryCost: m, timeCost: t, parallelism: p })
  .then(h => prisma.user.update({ where: { email }, data: { passwordHash: h } }))
  .then(() => { console.log('Rotation OK — nouveau mot de passe généré et écarté.'); })
  .finally(() => prisma.\$disconnect());
" -e "SMOKE_EMAIL=${SMOKE_EMAIL}"

echo "Compte ${SMOKE_EMAIL} : mot de passe tournéé (valeur non conservée)."
