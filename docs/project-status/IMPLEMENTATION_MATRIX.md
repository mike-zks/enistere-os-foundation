# IMPLEMENTATION_MATRIX.md — Matrice d'implémentation officielle

> Vérifiée depuis le repository (2026-06-09). Légende des statuts officiels : `ABSENT`,
> `DOSSIER_SEULEMENT`, `SPECIFICATION_DOCUMENTAIRE`, `ADR_EN_COURS`, `PREUVE_TECHNIQUE`,
> `STARTER_INITIALISE`, `IMPLEMENTATION_PARTIELLE`, `IMPLEMENTATION_AVANCEE`, `VALIDE_V1`, `SUSPENDU`,
> `A_REVOIR`. Colonnes : ✓ = présent/fait, — = absent/non fait.

## 1. Cores et packages

| Élément | Dossier | Spéc. | ADR | Starter | Code | Tests | Revue | Statut officiel | Dernière preuve | Prochaine condition |
|---|---|---|---|---|---|---|---|---|---|---|
| API Core NestJS | ✓ | ✓ | ✓ (002,003,004,006,007,016,039,040…) | ✓ | ✓ | ✓ (377 u + 101 e2e) | ✓ (3 rapports) | **IMPLEMENTATION_AVANCEE** | tests verts + live 16/16 (local) | commit Git ; CI/CD (ADR-013) |
| `@enistere/api-contracts` | ✓ | n/a | ✓ (016) | ✓ | ✓ | ✓ (11) | ✓ (proof) | **IMPLEMENTATION_AVANCEE** (local) | build + generate:check | publication (non requise V1) |
| `@enistere/api-client-fetch` | ✓ | n/a | ✓ (011,012,016) | ✓ | ✓ | ✓ (29 + live 16/16) | ✓ (proof) | **IMPLEMENTATION_AVANCEE** (local) | live 16/16 ; **instancié (public + authentifié/BFF) dans le Web Core** | publication (non requise V1) |
| Cloud Core | ✓ | ✓ | ✓ (013,014,007…) | — | — | — | — | **SPECIFICATION_DOCUMENTAIRE** | — | starter (après CI/registry) |
| Web Core Next.js | ✓ | ✓ | ✓ (004,005,006,009,011,012,016…) | **✓** | **✓ (App Router + UI Kit + API publique Health + TanStack Query + BFF Auth + me/authorization + session state + layout protégé serveur read-only Option C + hydratation + page /protected + page de connexion /login : formulaire, login BFF, returnTo interne assaini, navigation replace/refresh)** | **✓ (270, a11y + sonde HTTP + preuve API réelle Auth/session + protégé 26/26 + login 22/22 + états UI Web UI 1)** | **✓ (gouvernance + revue Auth V1 `WEB_AUTH_V1_REVIEW.md` → `AUTH_WEB_V1_STABLE_WITH_RESERVATIONS`)** | **IMPLEMENTATION_PARTIELLE** | build/lint/typecheck/**270 tests** verts + couverture + preuves API réelles (Auth/session ; protégé ; login ; runtime V1 33/33) + **états UI** (Alert/Card/FormField + Loading/Empty/Error/Unauthorized/Forbidden/ServiceUnavailable/PageHeader, intégrés, axe) | **Web Core Files 1** — consultation métadonnées + téléchargement sécurisé (lecture, sans upload) ; CI + E2E recommandés |
| Mobile Core React Native | ✓ | ✓ | ✓ (010,012,015…) | — | — | — | — | **SPECIFICATION_DOCUMENTAIRE** | — | UI Kit + secure storage |
| UI Kit (`@enistere/ui-kit`) | ✓ | ✓ | ✓ (008,009,010) | **✓** | **✓ (tokens + 9 primitives Web : Button/Input/Label/Text/Spinner/VisuallyHidden + Alert/Card/FormField)** | **✓ (78, 100 %, a11y/jest-axe, React 19)** | — | **IMPLEMENTATION_PARTIELLE** | aligné **React 19** (0 régression, v0.1.1) + **réellement consommé par le Web Core** (Web UI 1) ; pack:check OK | primitives interactives suppl. (UI Kit 4) ; **Tailwind/Radix/shadcn toujours absents** (ADR-009 partiel) |
| AI Core | ✓ (vide) | — | — | — | — | — | — | **DOSSIER_SEULEMENT** | — | spécification |
| API Core Spring Boot | ✓ (vide) | — | — | — | — | — | — | **DOSSIER_SEULEMENT** | — | spécification |
| Docs Core | ✓ (vide) | — | — | — | — | — | — | **DOSSIER_SEULEMENT** | — | spécification |
| Mobile Core Flutter | ✓ (vide) | — | ADR-034 (à rédiger) | — | — | — | — | **DOSSIER_SEULEMENT** | — | spécification + ADR-034 |
| Quality Core | ✓ (vide) | — | — | — | — | — | — | **DOSSIER_SEULEMENT** | — | spécification |
| Web Core Angular | ✓ (vide) | — | ADR-035 (à rédiger) | — | — | — | — | **DOSSIER_SEULEMENT** | — | spécification + ADR-035 |

## 2. Infrastructure transverse

| Élément | Spéc/ADR | Implémenté | Tests | Statut | Prochaine condition |
|---|---|---|---|---|---|
| CI/CD | ADR-013 Validé | — | — | **DECIDE_NON_IMPLEMENTE** | pipeline (hors core API) |
| Registry images | ADR-014 Validé | — | — | **DECIDE_NON_IMPLEMENTE** | choix registry + publication |
| Conteneurisation (Docker) | — | — | — | **ABSENT** | Dockerfile/compose (post-CI) |
| Observabilité (métriques/traces) | ADR-018/036 à rédiger | — | — | **NON_COMMENCE** | Cloud Core |
| Git (commits/branches) | ADR-001 Validé | **baseline `7dcb543` (main)** | — | **PARTIELLEMENT_IMPLEMENTE** | push `origin` (décision humaine) |

## 3. Matrice détaillée — API Core NestJS

| Domaine | Documenté | Implémenté | Testé | Revu | Version cible | Reste à faire |
|---|---|---|---|---|---|---|
| Socle NestJS / bootstrap | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Configuration + validation env | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Database Prisma/PostgreSQL | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Health (live/ready) | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Auth (login, JWT, sessions, refresh) | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Users | ✓ | ✓ | ✓ | ✓ | V1 | register public (dérivé) |
| Roles + Permissions (RBAC) | ✓ | ✓ | ✓ | ✓ | V1 | admin RBAC (V2) |
| Audit | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Files + Storage S3/MinIO | ✓ | ✓ | ✓ | ✓ | V1 | antivirus/média/présigné (V2) |
| Logging structuré (Pino) | ✓ | ✓ | ✓ | ✓ | V1 | collecte Loki (Cloud) |
| OpenAPI canonique + check | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Client contracts (package) | ✓ | ✓ | ✓ | ✓ | V1 | publication |
| Client fetch (package) | ✓ | ✓ | ✓ | ✓ | V1 | intégration cores |
| CI/CD | ✓ (ADR-013) | — | — | — | V1 (hors core) | pipeline |
| Redis (cache distribué) | ✓ | — | — | — | V2 | multi-instance |
| Queues/jobs (BullMQ) | ✓ | — | — | — | V2 | Redis |
| Mail / Notifications | ✓ | — | — | — | V2/V3 | infra |
| Observabilité (métriques/traces) | ✓ | — | — | — | V2 | Cloud Core |

Légende domaines : voir aussi la matrice native `cores/api-nestjs/docs/API_CORE_V1_IMPLEMENTATION_STATUS.md`
(référence détaillée maintenue dans le core). Ce tableau en est la synthèse de pilotage.

## 4. Contradictions détectées (documentées, NON corrigées)

| ID | Source A | Source B | État réel | Impact | Action recommandée | Priorité |
|---|---|---|---|---|---|---|
| C1 | Travail substantiel présent | `git log` | **Résolu (local)** : baseline `7dcb543` ; non poussée | Traçabilité locale OK ; pas encore de sauvegarde distante | Pousser vers `origin` (décision humaine) | RÉSOLU (local) / IMPORTANTE (push) |
| C2 | Packages dits « officiels » | Import dans les cores | **Intégré (public + authentifié)** : UI Kit **consommé** + `api-contracts`/`api-client-fetch` **instanciés** par le Web Core pour Health **et** le BFF Auth (login/refresh/logout/me/authorization), preuve API réelle. Reste : publication (non requise V1) | Lecture « intégré » vraie pour public **et** authentifié | — (publication différée) | RÉSOLU |
| C3 | ADR-005/012/013/014/015 Validés | Aucun code correspondant | Décidés, non implémentés (ADR-008 **partiel** : tokens + primitives UI Kit ; ADR-009/010 **partiels** : tokens consommés, stacks Tailwind/RN non ajoutées) | Lecture « fait » erronée | Implémenter au fil des cores | IMPORTANTE |
| C4 | `strategy/` Phase 0 (« avant code ») | API Core implémenté | Phase 0 partiellement dépassée | Contexte trompeur | Lire strategy comme historique | MINEURE |
| C5 | `OPENAPI_CLIENT_PROOF.md` cite `proofs/openapi-client/*` | Code de preuve retiré | Pointeur seul | Liens internes partiellement périmés | Bannière de migration déjà ajoutée | MINEURE |
| C6 | `cores/{cloud,mobile-react-native}` ont une spéc | Aucun starter | Documentaires ; **ui-kit et web-nextjs désormais `STARTER_INITIALISE`** | Confusion spéc↔implémentation | Statut explicite (cette matrice) | IMPORTANTE |
| C7 | Docs Web « starter sans auth » (`README`/`SECURITY.md`/`ARCHITECTURE.md` ; commentaires `cookie-config`/`query-client`) | BFF Auth + session implémentés | **Résolu** (revue de gouvernance 2026-06-10) : corrections factuelles appliquées + export mort `CSRF_HEADER_NAME` supprimé | Lecture « sans auth » erronée | — | RÉSOLU |
| C8 | `next build` (phase TS) du Web Core | `packages/*/dist` **non versionnés** (gitignore `dist/`) | **Réel** : clone neuf doit builder les paquets (`npm run build` racine) **avant** le Web Core ; aucune CI ne l'impose (ADR-013) | Build cassable sur clone neuf / futur pipeline | CI imposant l'ordre topologique (ADR-013) | IMPORTANTE (non bloquante) |

## 5. Dette documentaire

| Élément | Classe |
|---|---|
| Ordre de build monorepo (`packages/*/dist` non versionnés ; aucune CI ne l'impose — ADR-013) | IMPORTANTE |
| Absence d'E2E navigateur Web (flux session/logout couverts au niveau handler/transport + preuve API réelle) | IMPORTANTE |
| Baseline Git locale créée (`7dcb543`) **non poussée** vers `origin` | IMPORTANTE |
| Packages non intégrés (à clarifier dans les futurs cores) | IMPORTANTE |
| `strategy/` Phase 0 vs état réel (non versionné par ADR) | IMPORTANTE |
| `OPENAPI_CLIENT_PROOF.md` réfère un code retiré | MINEURE |
| `tools/` et `examples/` vides | MINEURE |
| ADR-017→038 cités au backlog mais non rédigés | HISTORIQUE (attendu) |
