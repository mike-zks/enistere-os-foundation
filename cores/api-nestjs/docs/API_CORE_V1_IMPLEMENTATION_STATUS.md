# API_CORE_V1_IMPLEMENTATION_STATUS.md — Matrice d'implémentation

> Statut par fonctionnalité du starter API Core NestJS V1. Légende statut :
> **OK** = implémenté et validé · **PARTIEL** = partiellement implémenté · **DOC** = documenté
> seulement · **TODO** = non commencé · **V2/V3** = reporté · **ADR** = nécessite une décision.

| Domaine | Fonctionnalité | Statut | Tests | Doc | ADR | Version cible | Blocage |
|---|---|---|---|---|---|---|---|
| Configuration | Chargement + validation env | OK | unit (`env.validation.spec`) | README/.env.example | ADR-003 | V1 | — |
| Configuration | Découpe par domaine | DOC | — | revue | — | V2 | non justifié en V1 |
| Database | Prisma + PrismaService | OK | unit+e2e | README | ADR-002 | V1 | — |
| Database | 5 migrations + seed idempotent | OK | runtime | README | — | V1 | — |
| Sécurité HTTP | Helmet, X-Powered-By off | OK | e2e (app) | revue | — | V1 | — |
| Sécurité HTTP | Limites body parsers | OK | config (`env.validation`) | .env.example | — | V1 | 413 e2e omis (artefact client) |
| Sécurité HTTP | CORS strict (rejet `*`) | OK | — | revue | ADR-005 (web) | V1 | — |
| Sécurité HTTP | trust proxy explicite | OK | config | .env.example | — | V1 | — |
| Sécurité HTTP | HSTS / CSP servie | DOC | — | revue | — | V1 (reverse proxy) | responsabilité Traefik |
| Observabilité | Request ID (`X-Request-Id`) | OK | unit+e2e | revue | — | V1 | — |
| Observabilité | Logging structuré (Pino) | OK | unit+e2e | `common/logging/README` | **ADR-040** | V1 | preuve nestjs-pino → Pino direct |
| Observabilité | Métriques (Prometheus) | DOC | — | revue | — | V2 | Cloud Core |
| Observabilité | Traces (OpenTelemetry) | DOC | — | revue | — | V2/V3 | Cloud Core |
| Health | liveness/readiness | OK | e2e (app) | revue | — | V1 | — |
| Auth | Argon2id + PasswordHasher | OK | unit+e2e | `auth/README` + ADR-039 | ADR-039 | V1 | — |
| Auth | login / access JWT / refresh opaque | OK | unit+e2e | `AUTH_RBAC_REVIEW` | ADR-004 | V1 | — |
| Auth | sessions révocables, rotation, reuse | OK | unit+e2e | `AUTH_RBAC_REVIEW` | ADR-004 | V1 | — |
| Auth | logout, `@Public`, `@CurrentUser`, `/auth/me` | OK | unit+e2e | `AUTH_RBAC_REVIEW` | — | V1 | — |
| Auth | rate limiting login/refresh | OK | e2e | `AUTH_RBAC_REVIEW` | — | V1 | — |
| Users | UsersModule interne | OK | unit+e2e | `users/README` | — | V1 | — |
| Users | register public / profil | TODO | — | — | — | dérivé | métier |
| Roles | rôles, `@Roles`, RolesGuard | OK | unit+e2e | `roles/README` | ADR-006 | V1 | — |
| Permissions | permissions fines, `@Permissions`, guard | OK | unit+e2e | `permissions/README` | ADR-006 | V1 | — |
| Authorization | contexte chargé serveur, `/auth/me/authorization` | OK | e2e | `AUTH_RBAC_REVIEW` | ADR-006 | V1 | — |
| RBAC | administration RBAC (CRUD public) | TODO | — | — | — | V2 | besoin à confirmer |
| Audit | AuditModule persistant non bloquant | OK | unit+e2e | modules | — | V1 | — |
| Files | upload multipart inspecté + checksum | OK | unit+e2e (MinIO) | `FILES_REVIEW` | ADR-007 | V1 | — |
| Files | stockage privé S3/MinIO | OK | unit+e2e | `FILES_REVIEW` | ADR-007 | V1 | — |
| Files | metadata + URL signée de lecture | OK | unit+e2e | `FILES_REVIEW` | ADR-007 | V1 | — |
| Files | suppression + quarantaine + restauration | OK | unit+e2e | `FILES_REVIEW` | ADR-007 | V1 | — |
| Files | réconciliation + purge + verrou + quotas | OK | unit+e2e | `FILES_REVIEW` | ADR-007 | V1 | — |
| Files | upload direct présigné | DOC | — | `FILES_REVIEW` | — | V2 | — |
| Files | antivirus | DOC | — | `FILES_REVIEW §21` | — | V2 | worker externe |
| Files | traitements médias | DOC | — | `FILES_REVIEW §22` | — | V2/V3 | worker externe |
| OpenAPI | Swagger + `openapi:generate`/`openapi:check` | OK | runtime+e2e | `openapi/README` | ADR-016 | V1 | — |
| OpenAPI | contrat canonique stabilisé (snapshot versionné) | OK | e2e (`openapi-contract`) | `openapi/README` | **ADR-016** | V1 | — |
| OpenAPI | DTO de sortie publics + enveloppes/erreurs typées | OK | e2e (`openapi-contract`) | `openapi/README` | **ADR-016** | V1 | — |
| OpenAPI | `operationId` stables + tags canoniques | OK | e2e (`openapi-contract`) | `openapi/README` | **ADR-016** | V1 | — |
| OpenAPI | preuve `openapi-typescript`/`openapi-fetch` | OK (validée, code retiré) | rapport `OPENAPI_CLIENT_PROOF` | `OPENAPI_CLIENT_PROOF` | **ADR-016** | V1 | migrée en packages |
| OpenAPI | packages `@enistere/api-contracts` + `api-client-fetch` | OK (local) | unit + live 16/16 (official) | `packages/*/README` | **ADR-016** | V1 | non publiés |
| OpenAPI | publication packages + intégration cores | TODO | — | `packages/*/README` | **ADR-016** | V1/V2 | CI/publication + cores (hors core API) |
| Tests | unitaires + e2e + couverture | OK | `test`/`test:e2e`/`test:cov` | revue | — | V1 | — |
| Redis | cache distribué (sessions/authz) | TODO | — | revue | — | V2 | multi-instance |
| Queues / Jobs | BullMQ + workers | TODO | — | — | — | V2 | infra |
| Mail | service email | TODO | — | — | — | V2 | infra/templates |
| Notifications | notifications | TODO | — | — | — | V2/V3 | métier |
| CI/CD | pipeline | TODO | — | — | ADR-013 | V1 | hors core (dépôt) |
| Conteneurisation | Dockerfile/Compose | TODO | — | — | ADR-014 | V1 | hors core |

## Synthèse

- **OK (V1)** : configuration, database, sécurité HTTP transverse, health live/ready, request ID,
  Auth complet, RBAC, audit, Files complet (Upload 1→5), **contrat OpenAPI canonique stabilisé**
  (DTO publics, enveloppes/erreurs typées, `operationId`/tags stables, snapshot versionné +
  `openapi:check`), tests.
- **Livré depuis** : logging structuré (ADR-040, Pino direct — preuve `nestjs-pino` documentée) ;
  **stabilisation du contrat OpenAPI canonique** (ADR-016) ; **preuve `openapi-typescript` +
  `openapi-fetch` validée puis MIGRÉE en packages officiels** `@enistere/api-contracts` +
  `@enistere/api-client-fetch` (`packages/`, code de preuve retiré) — **validés localement, non
  publiés, non intégrés aux cores ; aucun Axios/Orval**.
- **Étape ADR-016 suivante** : **publication** des packages (CI/registry, ADR-013) + **intégration**
  dans les cores Web/Mobile avec hooks TanStack Query (ADR-012) — **hors `cores/api-nestjs/`**.
- **Reporté V2/V3** : Redis, queues, mail, notifications, observabilité avancée, antivirus, médias,
  upload présigné, administration RBAC, register public.
- **Hors core** (dépôt/infra) : CI/CD (ADR-013), conteneurisation (ADR-014).
