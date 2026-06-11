# Cloud Core V1 — Baseline d'exécution (cadrage)

> **Cadrage opérationnel, non destructif.** Ce document transforme la CI minimale existante en **socle
> gouverné** : environnements, protection de branche, politique CI/CD progressive, secrets, registry,
> runtime API et E2E. **Aucun déploiement, Docker, registry, secret ni workflow runtime n'est créé ici.**
> Source de vérité : le repository réel + `cores/cloud/CORE_SPECIFICATION.md`. Date : 2026-06-10.

## 1. Objectif

Donner au Cloud Core une **base d'exécution gouvernée** avant toute infrastructure réelle : décrire ce qui
existe (CI minimale ADR-013), définir les **environnements logiques**, la **protection de branche**, la
**progression CI/CD**, et les **politiques** (secrets, registry, runtime API, E2E). Ces décisions préparent
l'implémentation future **sans l'anticiper** (pas de Compose, pas de Traefik, pas de GHCR, pas de déploiement).

## 2. État actuel

- **CI minimale présente** (`.github/workflows/ci.yml`, ADR-013 partiel) : GitHub Actions, Node 24, `npm ci`,
  `permissions: contents: read`, ordre `api-contracts → api-client-fetch → ui-kit → web-nextjs → audit`,
  `npm audit` 0 vuln, gardes Axios/Zustand. **Aucun secret, Docker, base, stockage, registry ni déploiement.**
- **API Core NestJS** : **CI runtime présente** (`.github/workflows/api-runtime-ci.yml`, niveau 2) —
  PostgreSQL + MinIO jetables en CI, migrations + unit + e2e + OpenAPI check + build + audit. Les preuves
  runtime ne sont donc plus seulement locales.
- **Web Core Next.js** : build **indépendant de l'API** ; preuves runtime rejouées localement (PostgreSQL +
  MinIO), **aucun E2E navigateur permanent**.
- **Cloud Core** : `CORE_SPECIFICATION.md` (cible complète) ; **aucune infrastructure réelle**.

## 3. Périmètre Cloud Core V1 (cette mission)

**Inclus (cadrage, Cloud Core 1)** : environnements, checklist de protection de branche (manuelle), politique
CI progressive (4 niveaux), politiques secrets/registry, plans CI runtime API et E2E Web, notes observabilité/
rollback. **Implémenté ensuite** : **Cloud Core 2** = CI **runtime API** (niveau 2, `api-runtime-ci.yml`) ;
**Cloud Core 3** = CI **E2E navigateur** (niveau 3, `web-e2e-ci.yml`). **Statut Cloud Core :
`IMPLEMENTATION_PARTIELLE`** — **trois** workflows CI réels (niveaux 1–3) existent, **mais** ni registry, ni
déploiement, ni environnements protégés, ni monitoring, ni rollback.

**Exclus** : Dockerfile, Compose, Traefik, GHCR/registry, déploiement, Helm/K8s/Terraform/Ansible, secrets
GitHub réels, GitHub Environments réels via API, workflows deploy/registry/runtime, monitoring réel, OSRM/
PostGIS réels, backups réels.

## 4. Ce qui existe déjà

| Élément | État |
|---|---|
| CI non-régression monorepo (ADR-013) | **présent** (`.github/workflows/ci.yml`, niveau 1) |
| **CI runtime API NestJS** (PostgreSQL + MinIO) | **présent** (`.github/workflows/api-runtime-ci.yml`, niveau 2 — Cloud Core 2) |
| **CI E2E navigateur** (stack réelle + Playwright) | **présent** (`.github/workflows/web-e2e-ci.yml`, niveau 3 — Cloud Core 3) |
| Ordre de build imposé | **présent** (jobs `needs`) |
| Garde `npm audit` 0 vuln | **présent** (monorepo + API) |
| Gardes Axios/Zustand | **présent** (ADR-011/012) |
| Build Web sans API | **présent** (force-dynamic) |
| Migrations Prisma + e2e API rejoués en CI | **présent** (niveau 2) |
| Parcours navigateur Health/Auth/Files rejoués en CI | **présent** (niveau 3) |

## 5. Ce qui n'existe pas encore

Protection de branche `main` (action humaine, non appliquée) · GitHub Environments · couverture publiée ·
build/push d'images (GHCR, ADR-014) · déploiement · staging/preview/production réels · monitoring/
observabilité · backups/restore · Traefik/DNS/TLS · secrets manager · **upload/suppression Files côté Web**.
*(Niveaux 1–3 — non-régression monorepo, runtime API + e2e, **E2E navigateur** — **existent** désormais.)*

## 6. Environnements cibles (logiques)

Voir la section **8** de cette baseline et `GITHUB_BRANCH_PROTECTION_CHECKLIST.md`. Cinq environnements
logiques : `local`, `ci`, `preview`, `staging`, `production`. **Seuls `local` et `ci` existent réellement
aujourd'hui** ; `preview`/`staging`/`production` sont **cadrés mais non implémentés**.

## 7. Politique de branches

`main` est la branche par défaut et la seule branche longue durée (ADR-001). **Recommandation V1** : protéger
`main` (PR obligatoire, CI obligatoire, force-push interdit, suppression interdite). Application **manuelle**
dans GitHub Settings — voir `GITHUB_BRANCH_PROTECTION_CHECKLIST.md`. Aucune application via l'API GitHub dans
cette mission.

## 8. Politique de CI (progressive)

Quatre niveaux — **niveaux 1, 2 et 3 implémentés** (voir aussi `.github/workflows/README.md`) :

- **Niveau 1 (présent — `ci.yml`)** : contrats, client API, UI Kit, Web Core, audit, gardes dépendances.
- **Niveau 2 (présent — `api-runtime-ci.yml`, Cloud Core 2)** : CI **runtime API NestJS** — PostgreSQL +
  MinIO **jetables**, **migrations Prisma** (`migrate deploy`), tests **unitaires + e2e**, **OpenAPI check**,
  build, audit ; **sans secret, sans déploiement, sans registre**. Détail : `API_RUNTIME_CI_PLAN.md`.
- **Niveau 3 (présent — `web-e2e-ci.yml`, Cloud Core 3)** : **E2E navigateur** Web — stack réelle
  (PostgreSQL + MinIO + **API + Web**) + **Playwright/Chromium** ; parcours **Health/Auth/Files** ; données
  éphémères ; traces `retain-on-failure` (**aucun artefact poussé**). Détail : `WEB_E2E_CI_PLAN.md`.
- **Niveau 4 (partiel — `registry-ci.yml`, Cloud Core 5)** : **registry GHCR** — build des images API/Web
  (Dockerfiles multi-stage, non-root) + **push GHCR sur `main`** (tags immuables `sha-`/`main-`, **pas de
  `latest`**, labels OCI, auth `GITHUB_TOKEN`). **Sans déploiement, sans secret applicatif, sans PAT.**
  **Reste du niveau 4 (futur)** : déploiement staging, approbation production, rollback, scan/signature d'image.
  Détail : `REGISTRY_POLICY.md`, `GHCR_REGISTRY_GUIDE.md`.

### 8 bis. Gouvernance & durcissement CI (Cloud Core 4)

**Checks à rendre bloquants sur `main`** (7, noms = `name:` des jobs) : `api-contracts`, `api-client-fetch`,
`ui-kit`, `web-nextjs`, `audit` (`ci.yml`) + `api-runtime` (`api-runtime-ci.yml`) + `web-e2e` (`web-e2e-ci.yml`).
Application **manuelle** (action humaine) — voir `GITHUB_BRANCH_PROTECTION_CHECKLIST.md`. **Statut : non
appliquée.**

- **Artefacts E2E — décision : Option A (aucun upload).** Les workflows n'uploadent **aucun** artefact ;
  Playwright conserve traces/captures `retain-on-failure` **localement au runner** (jetées en fin de job) →
  zéro risque de fuite (cookie, `.state.json`, URL signée). **Option B** (upload conditionnel `if: failure()`,
  rétention courte, dossier Playwright uniquement, sans logs d'env) reste une **évolution future documentée**,
  non activée tant que les risques ne sont pas parfaitement maîtrisés.
- **Couverture — décision : exécuter, ne pas publier.** Couvertures locales connues : UI Kit **100 %**, Web
  **≈ 87,8 %**, API (unit + e2e, `test:cov` disponible non exécuté en CI). **Aucun service externe**
  (Codecov/etc.) ni gate de couverture en CI pour l'instant. Seuils et publication = **durcissement futur**
  (niveau 4+), à introduire avec une cible chiffrée par core.
- **Pinning des actions — décision : conserver `@v4`.** `actions/checkout@v4` et `actions/setup-node@v4` sont
  épinglés par **majeure**. Le pinning par **SHA** (immuabilité totale) est un **durcissement futur** : il
  exige une politique de mise à jour (Dependabot/renovate) pour ne pas figer des versions vulnérables. Non
  basculé ici.
- **Validation YAML — décision : documentée, non outillée en CI.** `actionlint` **non installé** localement ;
  les 3 workflows sont validés par **parse YAML** (Python) + **simulations runtime** (Cloud Core 2/3). Ajouter
  un job `actionlint` est un **durcissement futur** (n'ajouter aucune dépendance lourde maintenant).

## 9. Politique de secrets

Détail : `SECRETS_POLICY.md`. Principe : **aucun secret dans le repository ni dans la CI minimale actuelle** ;
usage futur via **GitHub Environments** scoppés ; jamais de secret en `NEXT_PUBLIC_*` ; jamais de secret
journalisé. Cette mission **n'ajoute aucun secret**.

## 10. Politique registry (partiellement implémentée — Cloud Core 5)

Détail : `REGISTRY_POLICY.md` + `GHCR_REGISTRY_GUIDE.md`. **Implémentée** (`registry-ci.yml` + Dockerfiles
API/Web) : build + **push GHCR sur `main`**, tags **immuables** (`sha-`/`main-`, **pas de `latest`**), labels
OCI, auth `GITHUB_TOKEN`, **non-root**, **aucun secret/PAT**. **ADR-014 → `PARTIELLEMENT_IMPLEMENTE`.** Reste :
déploiement par environnement protégé, rollback, scan/signature d'image, semver/release.

## 11. Politique déploiement

**Staging** : cadré manuellement (Cloud Core 6) puis **dry-run contrôlé exécuté (Cloud Core 7, 2026-06-11)** —
statut **`DRY_RUN_EXECUTE` avec défaut bloquant**. Compose + `.env` **exemples** + runbooks
(`cores/cloud/staging/`, `STAGING_DEPLOYMENT_RUNBOOK.md`, `STAGING_ROLLBACK_RUNBOOK.md`) pour déployer **à la
main** les images GHCR immuables — **aucune exécution réelle**, aucun secret, aucune automatisation, aucun
`latest`. Le **dry-run** (`STAGING_DRY_RUN_REPORT.md`) a validé `compose config`/`pull`, postgres+minio, le
boot de l'**image Web** (HTTP 200), mais a révélé un **défaut bloquant** : l'**image API ne démarre pas**
(query engine Prisma OpenSSL **1.1.x** vs runtime **bookworm 3.0.x** → crash-loop). Il a aussi **corrigé** le
runbook : l'image **embarque** le CLI Prisma + le schema-engine (le « CLI absent » était faux) → **stratégie
migrations à rouvrir**. **Décision MinIO/URL signée** tranchée (Option A : `S3_ENDPOINT` = adresse publique du
serveur, jamais `minio:9000`). **Exécution staging réelle = BLOQUÉE** tant que l'image API n'est pas corrigée.
Cible (future) : image corrigée → staging exécuté → scripté → CI/CD avec environnements GitHub protégés +
approbation + **rollback** (§15). **Rollback d'image** simple mais conditionné à une image **qui boote** ;
**rollback DB non garanti** (migrations additives).

## 12. Politique runtime API (implémentée — niveau 2)

Détail : `API_RUNTIME_CI_PLAN.md`. **Implémentée** (`.github/workflows/api-runtime-ci.yml`) : services
PostgreSQL + MinIO jetables, `prisma generate/validate/migrate deploy`, tests unitaires + e2e, `openapi:check`,
`build`, `npm audit`, **logs sans secret** (`LOG_LEVEL=warn`), données éphémères. `cores/api-nestjs/` est un
projet npm **autonome** (`npm ci` propre). **Restent hors couverture** : déploiement, registre, environnements
protégés, monitoring, rollback.

## 13. Politique E2E (implémentée — niveau 3)

Détail : `WEB_E2E_CI_PLAN.md`. **Implémentée** (`.github/workflows/web-e2e-ci.yml` + `cores/web-nextjs/e2e/`) :
**Playwright/Chromium** headless contre une stack réelle (API + PostgreSQL + MinIO + Web), parcours
**Health/Auth/Files**, **données éphémères** (fixture VALIDATED via `global-setup.ts`), captures
`retain-on-failure`, **aucun secret**, **aucun artefact poussé**. E2E **isolés** du niveau 1
(`tsconfig`/`eslint` exclus).

## 14. Politique observabilité (future)

Aujourd'hui : **logs structurés** (Pino, ADR-040) + **`X-Request-Id`** propagé (API ↔ BFF Web). Plus tard
(V3/VF) : OpenTelemetry possible, Prometheus/Grafana/Loki/Alertmanager, dashboards **protégés**, rétention
définie. **Aucun monitoring réel** maintenant.

## 15. Politique rollback (future)

**Non implémenté.** Principe futur : revenir à un **tag/image précédent** (registry immuable), migrations DB
**prudentes** (compatibilité ascendante, pas de destructive sans plan), feature flags possibles. Tout
déploiement futur devra documenter sa procédure de rollback.

## 16. Limites V1

Niveaux 1–3 présents. **Restent** : protection de branche **non appliquée** (action humaine manuelle) ; pas
de couverture publiée ; pas de registry/déploiement/monitoring/backups ; environnements `preview`/`staging`/
`production` **théoriques**. La reproductibilité hors-CI (clone local) reste à documenter (ordre `npm run
build` racine). **Aucun statut n'est augmenté artificiellement** (Cloud Core `IMPLEMENTATION_PARTIELLE` : trois
workflows CI réels — non-régression, runtime API, E2E navigateur —, mais ni registry, ni déploiement, ni
environnements protégés, ni monitoring, ni rollback).

## 17. Étapes suivantes

1. **Cloud Core 8 — corriger l'image runtime API NestJS (moteur de requête Prisma)** : la générer/embarquer
   pour la plateforme runtime (Debian bookworm / OpenSSL **3.0.x**) afin que l'image **démarre**, puis
   **re-jouer le dry-run** (`STAGING_DRY_RUN_REPORT.md`). **Verrou n°1** : aucune exécution staging réelle
   possible avant. Trancher au passage la **stratégie migrations** (depuis l'image vs depuis les sources).
2. **Niveau 4 (suite)** : déploiement staging réel par environnement protégé + rollback (après image corrigée).
3. Durcissement CI complémentaire (couverture publiée, dépendances pinnées, **scan de secrets**, et — leçon
   CC7 — **smoke-run de l'image en CI** : exécuter brièvement l'image et vérifier `/health/ready`, pour ne plus
   laisser passer un défaut runtime invisible aux tests « depuis les sources »).
4. Rédiger les ADR structurants au moment voulu (registry si structurante, OSRM/PostGIS si adoptés).
