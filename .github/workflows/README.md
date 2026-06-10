# CI — workflows GitHub Actions

## `ci.yml` — CI minimale V1 (ADR-013)

Non-régression du monorepo. **Lecture seule**, sans secret, sans Docker, sans base de données ni stockage
objet, sans déploiement, sans registry (GHCR) ni publication npm.

### Déclencheurs

- `pull_request` (toutes branches cibles) ;
- `push` sur `main`.

`concurrency: ci-${{ github.ref }}` + `cancel-in-progress` (annule les exécutions obsolètes).
`permissions: contents: read` (aucune écriture, aucun token registry).

### Runtime

- **Node.js 24** (cohérent avec les preuves locales) ;
- **`npm ci`** (lockfile, installation reproductible) — jamais `npm install` ;
- cache npm via `actions/setup-node` (`cache: npm`).

### Ordre des jobs (imposé par `needs`)

```
api-contracts → api-client-fetch → ui-kit → web-nextjs → audit
```

Chaque job s'exécute sur un runner neuf : les `dist/` des paquets **ne sont pas versionnés**, donc chaque
job aval **rebuild ses dépendances** avant de se valider (`needs` garantit l'ordre **et** un échec lisible).

| Job | Vérifie | Dépend de |
|---|---|---|
| `api-contracts` | `generate:check` (snapshot OpenAPI ↔ types) · `typecheck` · `build` · `test` | — |
| `api-client-fetch` | build `api-contracts` (dist) → `typecheck` · `build` · `test` | `api-contracts` |
| `ui-kit` | `tokens:check` · `typecheck` · `build` · `lint` · `test` · `pack:check` | `api-client-fetch` |
| `web-nextjs` | build `api-contracts`+`api-client-fetch`+`ui-kit` → `typecheck` · `lint` · `test` · **`build` (sans API)** | `ui-kit` |
| `audit` | `npm audit` (0 vuln) · **Axios/Zustand absents** (ADR-011/012) · versions clés (react/react-query/next) | `web-nextjs` |

### Ce que la CI garantit

- Installation **reproductible** (`npm ci` sur lockfile) ;
- contrat **OpenAPI** à jour (aucun DTO divergent) ;
- paquets API + UI Kit + Web Core **compilent, lintent et testent** ;
- Web Core **build sans API** (routes privées/BFF dynamiques) ;
- **0 vulnérabilité** npm ; **Axios/Zustand jamais réintroduits** (ADR-011 Fetch / ADR-012 TanStack Query).

### Ce qu'elle ne garantit PAS encore

- Tests **e2e** de l'API NestJS (PostgreSQL + MinIO) ; **E2E navigateur** du Web ;
- **protection de branche** / approvals / environnements protégés ;
- artefacts/rapports de couverture publiés ;
- **build/publication d'images** (GHCR — ADR-014, non implémenté) ; déploiement ; release ; versioning npm.

### Prochaine évolution CI

Couverture publiée, protection de branche `main`, puis (Cloud Core) build/push d'images (ADR-014) et
déploiement par environnement. ADR-013 reste **`PARTIELLEMENT_IMPLEMENTE`** tant que ces éléments manquent.
