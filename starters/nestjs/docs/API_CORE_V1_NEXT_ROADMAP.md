# API_CORE_V1_NEXT_ROADMAP.md — Feuille de route jusqu'à la release V1

> Ordre **revu et justifié** par dépendances et risques (et non par l'ordre du document initial).
> La sécurité HTTP, le request ID et les sondes de santé étant **déjà livrés** par cette revue, la
> roadmap démarre au logging structuré. Chaque étape : objectif, dépendances, valeur, risques,
> priorité, critères d'acceptation.

## Déjà livré (revue d'étape)

Sécurité HTTP (Helmet, X-Powered-By, body limits, trust proxy, CORS strict), request ID, health
liveness/readiness, `openapi:generate`, `test:cov`. → Les étapes 1–3 de la roadmap initiale sont
**closes**. Depuis : logging structuré (ADR-040, étape 1), **stabilisation du contrat OpenAPI
canonique** (ADR-016, étape 2), **preuve `openapi-typescript`/`openapi-fetch`** (étape 2bis, migrée) et
**packages officiels `@enistere/api-contracts` + `api-client-fetch`** (étape 2ter — `packages/`,
validés localement, **non publiés, aucun Axios/Orval**).

## 1. Logging structuré + contrat d'observabilité minimal — ✅ **LIVRÉ (ADR-040)**

- **Statut** : implémenté et testé. ADR-040 rédigé ; preuve `nestjs-pino` réalisée
  (`docs/STRUCTURED_LOGGING_COMPATIBILITY_PROOF.md`) → **Pino direct** retenu (repli officiel).
- **Livré** : `AppLogger` (Pino), log HTTP unique (route normalisée, requestId, statut, durée),
  redaction centralisée, sérialiseur d'erreur (5xx), contexte de requête (AsyncLocalStorage,
  réutilise `X-Request-Id`), niveaux par environnement, JSON stdout (HTTP)/stderr (CLI),
  `AuditLog` séparé. Tests unitaires + e2e (incl. redaction). Collecte/Loki = Deployment.

## 2. Stabilisation du contrat OpenAPI canonique — ✅ **LIVRÉ (ADR-016, pré-clients)**

- **Statut** : implémenté et testé. Contrat **stabilisé comme source de vérité**, **avant** toute
  génération de client. Voir [`openapi/README.md`](../openapi/README.md).
- **Livré** : DTO de **sortie publics** (`*ResponseDto`, `PublicStoredFileDto`…) ; enveloppe de
  succès `{ success, data, timestamp }` (data typé) et **schéma d'erreur commun**
  `ApiErrorResponseDto` **alignés sur le runtime** (`requestId` inclus) ; `operationId` **stables**
  `<domaine>_<actionCamelCase>` + tags canoniques `Health`/`Auth`/`Files` ; formats explicites
  (`uuid`, `date-time`, **BigInt en chaîne**, `binary` multipart, enums fermées) ; en-tête
  `X-Request-Id` documenté ; **snapshot canonique versionné** `openapi/openapi.json` **déterministe**
  (deux générations = zéro diff) + `openapi:check` (diff strict, **sans outil externe**) ; **aucune
  fuite** Prisma/secret/champ interne (test de contrat `test/openapi-contract.e2e-spec.ts`).
- **Non fait (volontaire)** : **aucun client généré**, aucun outil OpenAPI externe ajouté (étape 2bis).

## 2bis. Preuve `openapi-typescript`/`openapi-fetch` — ✅ **LIVRÉ puis MIGRÉE**

- **Statut** : preuve **concluante** (`docs/OPENAPI_CLIENT_PROOF.md`) puis **migrée en packages
  officiels** ; code de preuve **retiré** (`proofs/openapi-client/README.md`).

## 2ter. Packages officiels `@enistere/api-contracts` + `api-client-fetch` — ✅ **LIVRÉ (local, non publié)**

- **Statut** : packages créés dans `packages/` (npm workspaces) et **validés localement** : builds +
  typecheck stricts, suites de tests, **preuve LIVE 16/16** ré-exécutée **avec le package officiel**
  contre une API réelle ; reproductibilité (`generate:check`) ; `npm pack --dry-run` propre ; **aucun
  Axios/Orval** ; contrat canonique inchangé.
- **`@enistere/api-contracts`** : types OpenAPI canoniques (runtime-indépendant), générés depuis le snapshot.
- **`@enistere/api-client-fetch`** : `openapi-fetch` + wrappers (auth/erreurs/timeout/refresh/multipart),
  façades `auth`/`files`, indépendant de TanStack Query/React/RN/Angular/Axios.
- **Non fait (volontaire)** : **publication** (npm/GitHub Packages), **CI**, hooks TanStack Query,
  adaptateurs Next.js/SecureStore concrets, intégration des cores clients.

## 2quater. Publication + intégration cores (ADR-016) — **P1 (hors `starters/nestjs/`)**

- **Objectif** : publier les packages (registry privé, ADR-013/014) avec détection de breaking changes
  (oasdiff) en CI ; intégrer dans starter Next.js et starter React Native (hooks TanStack Query,
  ADR-012 ; adaptateurs de session SecureStore/cookies).
- **Dépendances** : packages (2ter, **livrés**) ; CI (étape 3).
- **Acceptation** : publication reproductible ; breaking-change détecté avant merge ; cores consommant
  les packages sans redéfinir le contrat ; aucun Axios.

## 3. CI/CD API — **P1 (release V1)**

- **Objectif** : pipeline (install, prisma generate/validate, build, lint, test, test:e2e avec
  PostgreSQL+MinIO jetables, audit) ; artefact OpenAPI vérifié.
- **Dépendances** : ADR-013 (CI/CD), ADR-014 (registry/images). **Hors `starters/nestjs/`**
  (relève du dépôt) — d'où exclusion du périmètre de cette revue.
- **Valeur** : non-régression continue, reproductibilité.
- **Risques** : services jetables en CI ; secrets de CI ; durée e2e (`--runInBand`).
- **Acceptation** : pipeline vert reproduisant la chaîne locale ; e2e isolés ; aucun secret en clair.

## 4. Conteneurisation — **P2**

- **Objectif** : Dockerfile multi-stage + compose de dev (PostgreSQL+MinIO).
- **Dépendances** : ADR-014 ; CI (étape 3).
- **Valeur** : parité dev/prod, déploiement Deployment.
- **Risques** : taille d'image, secrets de build, exécution non-root.
- **Acceptation** : image qui démarre derrière Traefik, health live/ready branchés, non-root.

## 5. Observabilité (métriques/traces) — **P2 (post-V1)**

- **Objectif** : métriques HTTP/Prisma/auth/upload/S3 ; traces et propagation de contexte.
- **Dépendances** : logging structuré (étape 1) ; intégration Deployment (Prometheus/OTel).
- **Valeur** : supervision, SLO, diagnostic.
- **Risques** : surcharge, cardinalité des métriques, couplage à un backend.
- **Acceptation** : endpoint/format de métriques décidé par ADR ; pas de PII ; opt-in configurable.

## 6. Redis distribué — **P2 (post-V1)**

- **Objectif** : throttling et (option) contexte d'autorisation/sessions partagés en multi-instance.
- **Dépendances** : décision multi-instance ; invalidation stricte.
- **Valeur** : scalabilité horizontale.
- **Risques** : cohérence/invalidation, nouvelle dépendance d'infra.
- **Acceptation** : throttler Redis optionnel, invalidation testée, dégradation propre si Redis absent.

## 7. Queues / jobs (BullMQ) — **P3 (post-V1)**

- **Objectif** : exécution asynchrone (réconciliation planifiée, scan, médias).
- **Dépendances** : Redis (étape 6).
- **Valeur** : déport des traitements longs hors requête HTTP.
- **Risques** : idempotence, retries, observabilité des jobs.
- **Acceptation** : worker isolé, idempotent, retry borné, métriques de jobs.

## 8. Mail / notifications — **P3 (post-V1)**

- **Objectif** : service email transactionnel puis notifications.
- **Dépendances** : queues (étape 7), templates, fournisseur.
- **Valeur** : flux produits (vérification, alertes).
- **Risques** : délivrabilité, secrets fournisseur, contenu sensible.
- **Acceptation** : envoi asynchrone, gabarits sans secret, opt-in, audit.

## Prochain module recommandé (immédiat)

Les étapes 1 (logging, ADR-040), 2 (**stabilisation du contrat OpenAPI**), 2bis (**preuve**, migrée)
et 2ter (**packages officiels `@enistere/api-contracts` + `api-client-fetch`**, validés localement)
étant **livrées**, le prochain module est l'**étape 2quater** : **publication** des packages (CI/registry,
ADR-013/014) et **intégration** dans les cores Web/Mobile (hooks TanStack Query — ADR-012 — et
adaptateurs de session). Ces travaux relèvent du dépôt/des cores clients, **hors `starters/nestjs/`**.
Le risque technique sur le choix de la stack cliente est levé.
