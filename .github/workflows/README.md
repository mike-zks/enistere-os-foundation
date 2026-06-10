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

### Niveau CI actuel & progression (Cloud Core 1)

Le **Cloud Core 1** gouverne cette CI sans l'étendre vers le déploiement. La progression est cadrée dans
[`cores/cloud/docs/CLOUD_CORE_V1_EXECUTION_BASELINE.md`](../../cores/cloud/docs/CLOUD_CORE_V1_EXECUTION_BASELINE.md) :

- **Niveau 1 (présent — ce workflow)** : contrats, client API, UI Kit, Web Core (build sans API), audit,
  gardes Axios/Zustand.
- **Niveau 2 (futur)** : CI runtime API NestJS (PostgreSQL + MinIO en services) + e2e —
  [`API_RUNTIME_CI_PLAN.md`](../../cores/cloud/docs/API_RUNTIME_CI_PLAN.md).
- **Niveau 3 (futur)** : E2E navigateur Web — [`WEB_E2E_CI_PLAN.md`](../../cores/cloud/docs/WEB_E2E_CI_PLAN.md).
- **Niveau 4 (futur)** : build/push d'images (GHCR, ADR-014) + déploiement par environnement —
  [`REGISTRY_POLICY.md`](../../cores/cloud/docs/REGISTRY_POLICY.md).

**Protection de branche `main`** : à appliquer **manuellement** (rendre ces 5 checks bloquants) —
[`GITHUB_BRANCH_PROTECTION_CHECKLIST.md`](../../cores/cloud/docs/GITHUB_BRANCH_PROTECTION_CHECKLIST.md).
**Aucun déploiement, aucun secret, aucun registry** dans ce workflow. ADR-013 reste
**`PARTIELLEMENT_IMPLEMENTE`** tant que les niveaux 2–4 et la protection de branche ne sont pas en place ;
ADR-014 reste **`NON_IMPLEMENTE`**.
