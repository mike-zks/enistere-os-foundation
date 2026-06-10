# Cloud Core — Politique registry (cadrage, ADR-014)

> Cadre la future publication d'images applicatives. **Aucune image n'est construite ni poussée dans cette
> mission. ADR-014 reste `NON_IMPLEMENTE`.** Aligné sur `CORE_SPECIFICATION.md` §31 et ADR-014.

## 1. Statut

**ADR-014 (registry images) : `NON_IMPLEMENTE`.** La CI minimale (`.github/workflows/ci.yml`) **ne construit
ni ne pousse aucune image** ; `permissions: contents: read` exclut tout `packages: write`. Aucun `GHCR_TOKEN`,
aucun `docker build`, aucun login registry.

## 2. Cible (future, niveau 4)

- **Registry standard : GitHub Container Registry (GHCR)** — `ghcr.io/<org>/<image>`, intégré à GitHub
  Actions (auth via `GITHUB_TOKEN`/`packages: write`, scoppé au workflow déployant).
- Alternatives possibles si besoin : registry privé self-hosted, registry cloud compatible OCI. Le choix
  définitif sera tranché (et fera l'objet d'un **ADR** si structurant) selon sécurité, coûts, droits
  d'accès, rétention et intégration CI/CD.

## 3. Règles de tags (future)

- **Pas de `latest` comme référence de production unique** : `latest` ne doit jamais désigner ce qui tourne
  en prod.
- **Tags immuables** : référencer par **sha court** du commit (ex. `ghcr.io/.../api:sha-<7>`), jamais par un
  tag mobile réécrit.
- **semver plus tard** : tags `vX.Y.Z` à la mise en place du versioning/release (non décidé en V1).
- **build provenance / attestations plus tard** (SLSA, signatures) — niveau VF.

## 4. Sécurité (future)

- Images privées par défaut ; accès en lecture restreint ; jeton de pull scoppé.
- Aucune image non versionnée en production (anti-pattern interdit, `CORE_SPECIFICATION.md` §51).
- Scan de vulnérabilités d'image (futur) avant promotion vers `production`.
- Rétention/nettoyage des anciennes images documentés (coûts).

## 5. Ce que cette mission NE fait PAS

Pas de `Dockerfile`, pas de `docker build`, pas de `docker push`, pas de workflow registry, pas de
`packages: write`, pas de `GHCR_TOKEN`. La publication d'images est **explicitement hors périmètre** et
n'arrivera qu'au **niveau 4** de la politique CI progressive (`CLOUD_CORE_V1_EXECUTION_BASELINE.md` §8),
après la CI runtime API (niveau 2) et l'E2E Web (niveau 3).
