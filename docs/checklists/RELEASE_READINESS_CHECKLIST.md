# RELEASE_READINESS_CHECKLIST.md — Checklist avant release / promotion de statut

> Référence : `cores/quality-core/QUALITY_GATES_MATRIX.md`, `CORE_SPECIFICATION.md`.
> Dernière mise à jour : 2026-07-11 (Quality Core 1).

## Quand utiliser cette checklist

- Avant de promouvoir un core à un nouveau statut (ex. `IMPLEMENTATION_AVANCEE` → `VALIDE_V1`).
- Avant une release de package (`@enistere/ui-kit`, `@enistere/api-contracts`, etc.).
- Avant un déploiement staging majeur (Cloud Core).

---

## Partie 1 — Vérifications communes (toute release ou promotion)

### Documentation

- [ ] `CORE_SPECIFICATION.md` du core est à jour et reflète l'état réel
- [ ] `IMPLEMENTATION_MATRIX.md` reflète le nouveau statut avec preuve
- [ ] `FOUNDATION_CURRENT_STATE.md` mis à jour
- [ ] `NEXT_ACTIONS.md` mis à jour (action réalisée cochée, prochaine action identifiée)
- [ ] `SESSION_HANDOFF.md` mis à jour
- [ ] `CHANGELOG.md` entrée ajoutée dans `[Unreleased]`

### Git

- [ ] `git diff --check` — 0 whitespace error
- [ ] Branche feature propre, pas de fichiers non intentionnels
- [ ] PR ouverte avec description justifiant la promotion ou la release

### Audit

- [ ] `npm audit` root — 0 vulnérabilité

---

## Partie 2 — Promotion de statut d'un core

### Pré-conditions

- [ ] Rapport de revue rédigé dans `docs/project-status/` (ex. `UI_KIT_V1_READINESS_REVIEW.md`)
- [ ] Critères de validation de la `CORE_SPECIFICATION.md` vérifiés un par un
- [ ] Preuves d'exécution documentées (commandes + résultats)
- [ ] Les cores dépendants ont été notifiés / ne régressent pas

### Gates spécifiques par core cible

#### UI Kit → VALIDE_V1
- [ ] typecheck ✅ | lint ✅ | test 181/181 ✅ | build ✅ | tokens:check ✅ | audit 0 vuln ✅
- [ ] Consommation prouvée par au moins un core client (Web Core ou Mobile Core)
- [ ] §12.4 4/4 confirmés | §59 9/9 confirmés
- [ ] Réserves non bloquantes documentées

#### Web Core → VALIDE_V1
- [ ] typecheck ✅ | lint ✅ | test 450/450 ✅ | build ✅ | audit 0 vuln ✅
- [ ] E2E Playwright 15/15 ✅ (stack réelle API+PG+MinIO)
- [ ] §56 critères vérifiés (voir `cores/web-nextjs/CORE_SPECIFICATION.md`)

#### API Core → VALIDE_V1
- [ ] typecheck ✅ | lint ✅ | test 386/386 ✅ | test:e2e 101/101 ✅ (PG+MinIO)
- [ ] openapi:check ✅ | build ✅ | audit 0 vuln ✅
- [ ] Tests E2E navigateur (L3) verts

#### Mobile Core → VALIDE_V1 (futur)
- [ ] typecheck ✅ | lint ✅ | test 367+/367+ ✅ | expo export -p ios ✅ | doctor 19+/19 ✅
- [ ] smoke:android ✅ | smoke:ios ✅ (macOS requis — RN31 en attente)
- [ ] audit 0 vuln ✅

#### Quality Core → SPECIFICATION_DOCUMENTAIRE
- [ ] CORE_SPECIFICATION.md présent et complet
- [ ] README.md présent
- [ ] QUALITY_GATES_MATRIX.md présente et à jour
- [ ] Checklists docs/checklists/ présentes
- [ ] project-status mis à jour
- [ ] CHANGELOG.md entrée ajoutée
- [ ] git diff --check ✅ | npm audit root 0 vuln ✅

---

## Partie 3 — Release de package npm

#### @enistere/ui-kit
- [ ] Version dans `package.json` incrémentée (semver)
- [ ] `npm run pack:check --workspace=@enistere/ui-kit` ✅
- [ ] `npm run build --workspace=@enistere/ui-kit` ✅
- [ ] `npm run tokens:check --workspace=@enistere/ui-kit` ✅
- [ ] Entrée CHANGELOG.md

#### @enistere/api-contracts
- [ ] `npm run generate:check --workspace=@enistere/api-contracts` ✅ (pas de drift OpenAPI)
- [ ] `npm run build --workspace=@enistere/api-contracts` ✅
- [ ] Entrée CHANGELOG.md

#### @enistere/api-client-fetch
- [ ] `npm run build --workspace=@enistere/api-client-fetch` ✅
- [ ] Compatible avec la version de `@enistere/api-contracts` ciblée
- [ ] Entrée CHANGELOG.md

---

## Partie 4 — Déploiement staging (Cloud Core)

- [ ] Images GHCR disponibles avec tags `sha-` immutables
- [ ] `docker-compose.cc10.yml` mis à jour avec les nouveaux tags
- [ ] Tests staging selon runbook `CC11_OPERATIONAL_RUNBOOK.md` :
  - [ ] Health HTTPS × 3 — 200 ✅
  - [ ] TLS Let's Encrypt OK ✅
  - [ ] Backup PostgreSQL + restore validé (comptages lignes) ✅
  - [ ] Backup MinIO + restore test objet ✅
  - [ ] Rollback `sha-` précédente `healthy` ✅
  - [ ] Roll-forward `sha-` cible `healthy` ✅
- [ ] `CC11_STAGING_OPERATIONAL_REPORT.md` versionné
- [ ] Rapport de déploiement ajouté dans `CHANGELOG.md`

---

## Rappels

- Un dossier vide ≠ un core implémenté.
- Un ADR ≠ du code.
- Une spécification ≠ un starter.
- Une promotion de statut requiert **toujours** un rapport de revue versionné.
- Les tests Cloud staging ne sont pas reproductibles localement — ils ne bloquent pas les PRs docs.
