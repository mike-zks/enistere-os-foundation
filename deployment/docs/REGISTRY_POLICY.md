# Deployment — Politique registry (ADR-014)

> **PARTIELLEMENT IMPLÉMENTÉE (Deployment 5)** — workflow **`.github/workflows/registry-ci.yml`** + Dockerfiles
> API/Web. Build + **push GHCR sur `main` uniquement**, **sans déploiement, sans secret applicatif, sans PAT**.
> Aligné sur `DEPLOYMENT_SPECIFICATION.md` §31 et ADR-014. Guide pratique : `GHCR_REGISTRY_GUIDE.md`.

## 1. Statut

**ADR-014 (registry images) : `PARTIELLEMENT_IMPLEMENTE`.** Implémenté : build des images API/Web, push **GHCR**
sur `main`, tags **immuables**, labels OCI, auth via `GITHUB_TOKEN`. **Non implémenté** (volontaire) :
déploiement, environnements, rollback, scan de vulnérabilité d'image, signature/provenance (SLSA), semver/release,
rétention automatisée. La CI niveaux 1–3 (`ci.yml`/`api-runtime-ci.yml`/`web-e2e-ci.yml`) reste **inchangée**.

## 2. Registry & images

- **GHCR** : `ghcr.io/<owner>/<repo>/api-nestjs` et `ghcr.io/<owner>/<repo>/web-nextjs` (owner/repo dérivés de
  `github.repository`, minuscules forcés par `docker/metadata-action`). Pas de nom hardcodé.
- **Auth** : `GITHUB_TOKEN` automatique + `permissions: packages: write` (login **conditionnel**, push `main`
  seulement). **Aucun `GHCR_TOKEN`, aucun PAT, aucun secret custom.**
- Alternative (privé self-hosted / cloud OCI) : différée, ADR si structurant.

## 3. Règles de tags

- **`latest` JAMAIS généré** (`flavor: latest=false`) — aucune référence mobile.
- **Tags immuables** : **`sha-<short>`** (toujours), **`main-<short>`** (sur `main`). Build PR taggé
  **`pr-<n>`** mais **non poussé**.
- **semver** (`vX.Y.Z`) plus tard avec le versioning/release (non décidé).
- **provenance / attestations / signature** (SLSA, cosign) plus tard.

## 4. Sécurité

- **Aucun secret dans l'image** : Dockerfiles **ne copient aucun `.env`** ; aucune URL d'API de production
  figée ; build args non sensibles uniquement.
- Exécution **non-root** (`USER node`) dans les deux images.
- Build PR **sans push** (vérifie la constructibilité sans publier) ; push **uniquement** `push main`.
- À venir : scan de vulnérabilité d'image avant promotion, images privées/visibilité selon le repo, rétention.

## 5. Ce que cette mission NE fait PAS

Pas de déploiement, staging, production, preview, rollback, monitoring, backup, `docker-compose` de prod,
K8s/Helm/Terraform/Ansible, release GitHub, tag git automatique, publication npm. Le **niveau 4 complet**
(déploiement par environnement protégé) reste futur (`CLOUD_CORE_V1_EXECUTION_BASELINE.md` §8).
