# syntax=docker/dockerfile:1
# Image du Web Core Next.js (Cloud Core 5 — registry GHCR). Build reproductible, multi-stage, non-root.
# Sortie **standalone** (serveur minimal + dépendances tracées, y compris les paquets de workspace).
# L'image NE DÉPLOIE RIEN, ne copie aucun secret, n'embarque aucune URL d'API de production.
# Contexte de build attendu : RACINE du monorepo (le Web dépend de packages/* et packages/ui-kit).

# --- Stage build : workspace racine, build des paquets puis du Web (standalone) ---
FROM node:24-slim AS build
WORKDIR /repo
# Manifests d'abord (cache de couche `npm ci`).
COPY package.json package-lock.json ./
COPY packages/api-contracts/package.json packages/api-contracts/
COPY packages/api-client-fetch/package.json packages/api-client-fetch/
COPY packages/ui-kit/package.json packages/ui-kit/
COPY starters/nextjs/package.json starters/nextjs/
RUN npm ci
# Sources nécessaires au build (paquets + UI Kit + Web). Le `.dockerignore` exclut node_modules/.next/e2e/etc.
COPY packages ./packages
COPY packages/ui-kit ./packages/ui-kit
COPY starters/nextjs ./starters/nextjs
# Ordre de build imposé puis Web (génère `.next/standalone`). Aucun NEXT_PUBLIC_* figé (build indépendant de l'API).
RUN npm run build --workspace=@enistere/api-contracts \
 && npm run build --workspace=@enistere/api-client-fetch \
 && npm run build --workspace=@enistere/ui-kit \
 && npm run build --workspace=@enistere/web-nextjs

# --- Stage runtime : serveur standalone autonome ---
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Arbre standalone (contient starters/, packages/, node_modules tracés, package.json) + assets statiques.
COPY --from=build /repo/starters/nextjs/.next/standalone ./
COPY --from=build /repo/starters/nextjs/.next/static ./starters/nextjs/.next/static
# Exécution NON-root.
USER node
EXPOSE 3000
# Serveur standalone Next.js (respecte PORT/HOSTNAME). API_INTERNAL_URL = variable RUNTIME (jamais figée ici).
CMD ["node", "starters/nextjs/server.js"]
