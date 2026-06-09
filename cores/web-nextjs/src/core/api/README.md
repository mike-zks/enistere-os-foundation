# `core/api` — couche d'accès API

Couche de transport du Web Core. **Intégration publique uniquement** (endpoints Health) — aucune
authentification.

## Implémenté

- `run-public-request.ts` — exécution `client.raw` (timeout + normalisation `ApiClientError`).
- `server/create-server-api-client.ts` — factory **serveur par requête** (`API_INTERNAL_URL`, no-store).
- `public/public-api-client.ts` — client **public** navigateur (sans session, `enableRefresh:false`).
- `health/health-transport.ts` — `getHealth/getLiveness/getReadiness` (types via `SchemaOf<>`).
- `errors/map-api-error.ts` — message public générique (`kind`/`status`), sans fuite.

Les paquets `@enistere/api-contracts` et `@enistere/api-client-fetch` sont **réellement consommés**
(transport Health). Détail : [`../../../docs/api-integration.md`](../../../docs/api-integration.md).

## Hors périmètre (incréments ultérieurs)

- **Client authentifié** : il passera par un **BFF** + cookies `HttpOnly` (ADR-005/011) et **ne
  réutilisera pas** le client public. Voir [`../auth/README.md`](../auth/README.md).
- Endpoints **Files** / upload (ADR-007).
- Hooks de domaines métier (au fil des features).

> Ne pas ajouter d'appel authentifié ni d'endpoint privé ici sans mission dédiée.
