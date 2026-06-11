# syntax=docker/dockerfile:1
# Image de l'API Core NestJS (Cloud Core 5 — registry GHCR). Build reproductible, multi-stage, non-root.
# L'image NE DÉPLOIE RIEN : pas de migrations au build, pas de secret copié, pas de .env.
# Contexte de build attendu : `cores/api-nestjs/`.

# --- Stage build : dépendances complètes + génération Prisma + nest build ---
FROM node:24-slim AS build
WORKDIR /app
# openssl/ca-certificates AUSSI au build : sans openssl, `prisma generate` détecte mal la libssl et
# repliait `native` sur `debian-openssl-1.1.x` (incompatible avec le runtime bookworm 3.0.x). Cloud Core 8.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
# Lockfile d'abord (cache de couche). `npm ci` installe TOUTES les deps (dont devDeps : nest CLI, ts, prisma).
COPY package.json package-lock.json ./
RUN npm ci
# Client Prisma généré (le schéma ne change pas au runtime). `binaryTargets` du schéma force le moteur
# `debian-openssl-3.0.x` (copié depuis @prisma/engines, sans réseau) → présent dans node_modules/.prisma/client.
COPY prisma ./prisma
RUN npx prisma generate
# Sources + config de build, puis compilation (nest build → dist/).
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# --- Stage runtime : dépendances de production uniquement + artefacts ---
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# openssl requis par le moteur de requête Prisma. ca-certificates pour les appels TLS sortants.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
# Deps de PRODUCTION uniquement. Ne pas régénérer Prisma ici (pas de CLI en prod).
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
# Client Prisma généré (depuis le stage build) + schéma (insurance) + code compilé.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist
# Exécution NON-root (utilisateur `node` fourni par l'image).
USER node
# Port applicatif par défaut (surchargé par la variable d'env PORT au runtime/déploiement, hors périmètre).
EXPOSE 3000
CMD ["node", "dist/main.js"]
