# Deployment V1 — Baseline d'exécution (cadrage)

> **Cadrage opérationnel, non destructif.** Ce document transforme la CI minimale existante en **socle
> gouverné** : environnements, protection de branche, politique CI/CD progressive, secrets, registry,
> runtime API et E2E. **Aucun déploiement, Docker, registry, secret ni workflow runtime n'est créé ici.**
> Source de vérité : le repository réel + `deployment/DEPLOYMENT_SPECIFICATION.md`. Date : 2026-06-10.
>
> **Note 2026-07-12 :** ce document est une baseline historique Deployment 1. L'etat courant est
> `VALIDE_V1` après CC12 ; voir `../README.md` et
> `../../../docs/project-status/CLOUD_CORE_12_REDIS_COMPOSE_DECISION.md`.

## 1. Objectif

Donner au Deployment une **base d'exécution gouvernée** avant toute infrastructure réelle : décrire ce qui
existe (CI minimale ADR-013), définir les **environnements logiques**, la **protection de branche**, la
**progression CI/CD**, et les **politiques** (secrets, registry, runtime API, E2E). Ces décisions préparent
l'implémentation future **sans l'anticiper** (pas de Compose, pas de Traefik, pas de GHCR, pas de déploiement).

## 2. État actuel

- **CI minimale présente** (`.github/workflows/ci.yml`, ADR-013 partiel) : GitHub Actions, Node 24, `npm ci`,
  `permissions: contents: read`, ordre `api-contracts → api-client-fetch → ui-kit → web-nextjs → audit`,
  `npm audit` 0 vuln, gardes Axios/Zustand. **Aucun secret, Docker, base, stockage, registry ni déploiement.**
- **starter NestJS** : **CI runtime présente** (`.github/workflows/api-runtime-ci.yml`, niveau 2) —
  PostgreSQL + MinIO jetables en CI, migrations + unit + e2e + OpenAPI check + build + audit. Les preuves
  runtime ne sont donc plus seulement locales.
- **Web Core Next.js** : build **indépendant de l'API** ; preuves runtime rejouées localement (PostgreSQL +
  MinIO), **aucun E2E navigateur permanent**.
- **Deployment** : `DEPLOYMENT_SPECIFICATION.md` (cible complète) ; **aucune infrastructure réelle**.

## 3. Périmètre Deployment V1 (cette mission)

**Inclus (cadrage, Deployment 1)** : environnements, checklist de protection de branche (manuelle), politique
CI progressive (4 niveaux), politiques secrets/registry, plans CI runtime API et E2E Web, notes observabilité/
rollback. **Implémenté ensuite** : **Deployment 2** = CI **runtime API** (niveau 2, `api-runtime-ci.yml`) ;
**Deployment 3** = CI **E2E navigateur** (niveau 3, `web-e2e-ci.yml`). **Statut Deployment :
`IMPLEMENTATION_PARTIELLE`** — **trois** workflows CI réels (niveaux 1–3) existent, **mais** ni registry, ni
déploiement, ni environnements protégés, ni monitoring, ni rollback.

**Exclus** : Dockerfile, Compose, Traefik, GHCR/registry, déploiement, Helm/K8s/Terraform/Ansible, secrets
GitHub réels, GitHub Environments réels via API, workflows deploy/registry/runtime, monitoring réel, OSRM/
PostGIS réels, backups réels.

## 4. Ce qui existe déjà

| Élément | État |
|---|---|
| CI non-régression monorepo (ADR-013) | **présent** (`.github/workflows/ci.yml`, niveau 1) |
| **CI runtime API NestJS** (PostgreSQL + MinIO) | **présent** (`.github/workflows/api-runtime-ci.yml`, niveau 2 — Deployment 2) |
| **CI E2E navigateur** (stack réelle + Playwright) | **présent** (`.github/workflows/web-e2e-ci.yml`, niveau 3 — Deployment 3) |
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
- **Niveau 2 (présent — `api-runtime-ci.yml`, Deployment 2)** : CI **runtime API NestJS** — PostgreSQL +
  MinIO **jetables**, **migrations Prisma** (`migrate deploy`), tests **unitaires + e2e**, **OpenAPI check**,
  build, audit ; **sans secret, sans déploiement, sans registre**. Détail : `API_RUNTIME_CI_PLAN.md`.
- **Niveau 3 (présent — `web-e2e-ci.yml`, Deployment 3)** : **E2E navigateur** Web — stack réelle
  (PostgreSQL + MinIO + **API + Web**) + **Playwright/Chromium** ; parcours **Health/Auth/Files** ; données
  éphémères ; traces `retain-on-failure` (**aucun artefact poussé**). Détail : `WEB_E2E_CI_PLAN.md`.
- **Niveau 4 (partiel — `registry-ci.yml`, Deployment 5)** : **registry GHCR** — build des images API/Web
  (Dockerfiles multi-stage, non-root) + **push GHCR sur `main`** (tags immuables `sha-`/`main-`, **pas de
  `latest`**, labels OCI, auth `GITHUB_TOKEN`). **Sans déploiement, sans secret applicatif, sans PAT.**
  **Reste du niveau 4 (futur)** : déploiement staging, approbation production, rollback, scan/signature d'image.
  Détail : `REGISTRY_POLICY.md`, `GHCR_REGISTRY_GUIDE.md`.

### 8 bis. Gouvernance & durcissement CI (Deployment 4)

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
  les 3 workflows sont validés par **parse YAML** (Python) + **simulations runtime** (Deployment 2/3). Ajouter
  un job `actionlint` est un **durcissement futur** (n'ajouter aucune dépendance lourde maintenant).

## 9. Politique de secrets

Détail : `SECRETS_POLICY.md`. Principe : **aucun secret dans le repository ni dans la CI minimale actuelle** ;
usage futur via **GitHub Environments** scoppés ; jamais de secret en `NEXT_PUBLIC_*` ; jamais de secret
journalisé. Cette mission **n'ajoute aucun secret**.

## 10. Politique registry (partiellement implémentée — Deployment 5)

Détail : `REGISTRY_POLICY.md` + `GHCR_REGISTRY_GUIDE.md`. **Implémentée** (`registry-ci.yml` + Dockerfiles
API/Web) : build + **push GHCR sur `main`**, tags **immuables** (`sha-`/`main-`, **pas de `latest`**), labels
OCI, auth `GITHUB_TOKEN`, **non-root**, **aucun secret/PAT**. **ADR-014 → `PARTIELLEMENT_IMPLEMENTE`.** Reste :
déploiement par environnement protégé, rollback, scan/signature d'image, semver/release.

## 11. Politique déploiement

**Staging V1** : `deployment/staging/docker-compose.cc10.yml` est le compose serveur/staging V1 officiel
(decision CC12). Il remplace le compose exemple CC6 pour la validation V1 : reverse proxy compatible Traefik,
Let's Encrypt, aucun port applicatif hote, PostgreSQL interne, MinIO API routee HTTPS, images GHCR immuables.

Historique :

- CC6 : cadrage staging manuel ;
- CC7 : dry-run local, defaut image API detecte ;
- CC8 : correction moteur Prisma OpenSSL 3.0.x et `api-smoke` registry ;
- CC9 : execution locale controlee ;
- CC10 : staging HTTPS reel valide ;
- CC11 : health, backup/restore, rollback/roll-forward et rotation smoke verifies.

Redis est reporte post-V1/V2 : aucun service Redis n'est requis pour le staging V1. Les tests serveur reels
restent des gates finaux gouvernes par runbook, pas des checks systematiques de chaque PR.

## 12. Politique runtime API (implémentée — niveau 2)

Détail : `API_RUNTIME_CI_PLAN.md`. **Implémentée** (`.github/workflows/api-runtime-ci.yml`) : services
PostgreSQL + MinIO jetables, `prisma generate/validate/migrate deploy`, tests unitaires + e2e, `openapi:check`,
`build`, `npm audit`, **logs sans secret** (`LOG_LEVEL=warn`), données éphémères. `starters/nestjs/` est un
projet npm **autonome** (`npm ci` propre). **Restent hors couverture** : déploiement, registre, environnements
protégés, monitoring, rollback.

## 13. Politique E2E (implémentée — niveau 3)

Détail : `WEB_E2E_CI_PLAN.md`. **Implémentée** (`.github/workflows/web-e2e-ci.yml` + `starters/nextjs/e2e/`) :
**Playwright/Chromium** headless contre une stack réelle (API + PostgreSQL + MinIO + Web), parcours
**Health/Auth/Files**, **données éphémères** (fixture VALIDATED via `global-setup.ts`), captures
`retain-on-failure`, **aucun secret**, **aucun artefact poussé**. E2E **isolés** du niveau 1
(`tsconfig`/`eslint` exclus).

## 14. Politique observabilité (future)

Aujourd'hui : **logs structurés** (Pino, ADR-040) + **`X-Request-Id`** propagé (API ↔ BFF Web). Plus tard
(V3/VF) : OpenTelemetry possible, Prometheus/Grafana/Loki/Alertmanager, dashboards **protégés**, rétention
définie. **Aucun monitoring réel** maintenant.

## 15. Politique rollback

Rollback d'image **verifie en CC11** : retour a un tag/image precedent, health Web/API, puis roll-forward vers
l'image nominale. Le rollback DB reste une operation separee : les migrations doivent rester prudentes et tout
changement destructif exige un plan de restore.

## 16. Limites V1

Niveaux 1–3 présents, registry GHCR presente, staging HTTPS reel valide, backups/restores et rollback verifies.
**Restent hors V1** : production, workflow deploy automatique, environnements GitHub reels, monitoring/alerting,
Redis standardise, OSRM/PostGIS, scan/signature d'image, compose generique `base/local/prod`. La reproductibilité
hors-CI (clone local) reste à documenter (ordre `npm run build` racine). **Statut courant** : Deployment
`VALIDE_V1` après CC12.

## 17. Étapes suivantes

1. ✅ **FAIT (Deployment 8)** — image runtime API corrigée (moteur Prisma `debian-openssl-3.0.x`), re-validée
   (stack staging `healthy`), et **angle mort CI fermé** (`api-smoke` dans `registry-ci.yml`, gate du push).
2. **Deployment 9 — exécution staging réelle contrôlée sur serveur** : appliquer les runbooks sur un **serveur
   staging identifié** (image GHCR API **reconstruite après le merge CC8**, secrets hors dépôt, `S3_ENDPOINT`
   **public** Option A), vérifier health + parcours réels (dont **téléchargement navigateur** via URL signée).
3. Durcissement CI complémentaire (couverture publiée, dépendances pinnées, **scan de secrets** ; rendre le
   check **`api-smoke`** *required* sur `main` — action humaine).
4. Rédiger les ADR structurants au moment voulu (registry si structurante, OSRM/PostGIS si adoptés).
