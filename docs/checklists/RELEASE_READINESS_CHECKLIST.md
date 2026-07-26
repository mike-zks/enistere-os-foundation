# RELEASE_READINESS_CHECKLIST.md — Checklist avant release / promotion de statut

> Référence : `factory/quality/QUALITY_GATES_MATRIX.md`, `specification active`,
> `factory/quality/BRANCH_PROTECTION_RUNBOOK.md`,
> `factory/quality/RELEASE_PROCESS_RUNBOOK.md`.
> Dernière mise à jour : 2026-07-11 (Factory Quality 5).

## Quand utiliser cette checklist

- Avant de promouvoir un core à un nouveau statut (ex. `IMPLEMENTATION_AVANCEE` → `VALIDE_V1`).
- Avant une release de package (`@enistere/ui-kit`, `@enistere/api-contracts`, etc.).
- Avant un déploiement staging majeur (Deployment).
- Avant une release Foundation (`foundation-v1-baseline`, `core-v1-validation`, etc.).

> **Rappel** : un merge ≠ une release. Voir `RELEASE_PROCESS_RUNBOOK.md` §1 pour les définitions.

---

## Partie 1 — Vérifications communes (toute release ou promotion)

### Documentation

- [ ] `specification active` du core est à jour et reflète l'état réel
- [ ] `IMPLEMENTATION_MATRIX.md` reflète le nouveau statut avec preuve
- [ ] `FOUNDATION_CURRENT_STATE.md` mis à jour
- [ ] `NEXT_ACTIONS.md` mis à jour (action réalisée cochée, prochaine action identifiée)
- [ ] `FOUNDATION_CURRENT_STATE.md` mis à jour
- [ ] `CHANGELOG.md` entrée ajoutée dans `[Unreleased]`

### Git

- [ ] `git diff --check` — 0 whitespace error
- [ ] Branche feature propre, pas de fichiers non intentionnels
- [ ] PR ouverte avec description justifiant la promotion ou la release

### Audit

- [ ] `npm audit` root — 0 vulnérabilité

### Protection de branche `main`

- [ ] Vérifier que la protection de branche est active via GitHub Rulesets (`protect-main`, enforcement `active`)
- [ ] Vérifier que les 8 checks requis sont présents : `api-contracts`, `api-client-fetch`, `ui-kit`, `web-nextjs`, `audit`, `api-runtime`, `web-e2e`, `api-smoke`
- [ ] Si non activée : appliquer selon `factory/quality/BRANCH_PROTECTION_RUNBOOK.md`
- [ ] Si les checks `images` deviennent obligatoires : documenter la décision dans `IMPLEMENTATION_MATRIX.md` et `QUALITY_GATES_MATRIX.md`

---

## Partie 2 — Promotion de statut d'un core

### Pré-conditions

- [ ] Rapport de revue rédigé dans `docs/project-status/` (ex. `UI_KIT_V1_READINESS_REVIEW.md`)
- [ ] Critères de validation de la `specification active` vérifiés un par un
- [ ] Preuves d'exécution documentées (commandes + résultats)
- [ ] Les cores dépendants ont été notifiés / ne régressent pas

### Gates spécifiques par core cible

#### UI Kit → VALIDE_V1
- [ ] typecheck ✅ | lint ✅ | test 181/181 ✅ | build ✅ | tokens:check ✅ | audit 0 vuln ✅
- [ ] Consommation prouvée par au moins un core client (Web Core ou Mobile Core)
- [ ] §12.4 4/4 confirmés | §59 9/9 confirmés
- [ ] Réserves non bloquantes documentées

#### Web Core → VALIDE_V1
- [ ] typecheck ✅ | lint ✅ | test 94/94 ✅ | build ✅ | audit gouverné ✅
- [ ] E2E Playwright 15/15 ✅ (stack réelle API+PG+MinIO)
- [ ] §56 critères vérifiés (voir `starters/nextjs/STARTER_SPECIFICATION.md`)

#### API Core → VALIDE_V1
- [ ] typecheck ✅ | lint ✅ | test 386/386 ✅ | test:e2e 101/101 ✅ (PG+MinIO)
- [ ] openapi:check ✅ | build ✅ | audit 0 vuln ✅
- [ ] Tests E2E navigateur (L3) verts

#### Mobile Runtimes → Common/Mobile v2
- [ ] React Native : typecheck ✅ | lint ✅ | 321 tests ✅ | export iOS ✅ | doctor 19/19 ✅
- [ ] Flutter : format ✅ | analyze ✅ | 9 tests ✅ | APK debug ✅
- [ ] goldens reproductibles et audit gouverné ✅
- [ ] tests device déclarés séparément ; aucune preuve simulée si l’environnement manque

#### Factory Quality → SPECIFICATION_DOCUMENTAIRE
- [ ] specification active présent et complet
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

## Partie 4 — Déploiement staging (Deployment)

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

---

## Partie 5 — Release Foundation

> Utiliser pour une release de type `foundation-v1-baseline`, `core-v1-validation`, `quality-v2-increment`,
> `staging-candidate` ou `hotfix`. Voir `factory/quality/RELEASE_PROCESS_RUNBOOK.md` §3 pour les critères.

### Prérequis Foundation Release

- [ ] `main` propre : `git log origin/main..HEAD` vide (aligné avec `origin/main`)
- [ ] Toutes les PRs critiques fusionnées ou explicitement exclues (justification documentée)
- [ ] Type de release identifié : `foundation-v1-baseline` / `core-v1-validation` / `quality-v2-increment` / `staging-candidate` / `hotfix`
- [ ] Scope défini : cores inclus + exclusions justifiées

### Gates Foundation Release

- [ ] `node factory/quality/scripts/quality-gates.mjs run all-safe` — 17/17 ✓ (selon scope)
- [ ] CI L1 verte sur `main` (`api-contracts` / `api-client-fetch` / `ui-kit` / `web-nextjs` / `audit`)
- [ ] CI L2 verte (`api-runtime`) — si API Core inclus
- [ ] CI L3 verte (`web-e2e`) — si Web Core inclus
- [ ] CI L4 verte (`api-smoke` / `images`) — si runtime images inclus

### Documentation Foundation Release

- [ ] `CHANGELOG.md` à jour (section `[Unreleased]` avec tous les changements)
- [ ] `FOUNDATION_CURRENT_STATE.md` cohérent avec les preuves
- [ ] `IMPLEMENTATION_MATRIX.md` cohérent — aucun statut non prouvé
- [ ] Notes de release rédigées selon format `RELEASE_PROCESS_RUNBOOK.md` §6
- [ ] Gates non exécutés documentés avec raison
- [ ] Aucun secret, token, URL signée dans les notes ou le diff

### Tag et billet (action humaine — après merge)

- [ ] Tag Git créé selon convention `RELEASE_PROCESS_RUNBOOK.md` §7 (après merge `main` uniquement)
- [ ] Billet GitHub Release créé avec les notes de release
- [ ] SHA GHCR correspondant documenté si images incluses

---

## Rappels

- Un dossier vide ≠ un core implémenté.
- Un ADR ≠ du code.
- Une spécification ≠ un starter.
- **Un merge ≠ une release** — voir `RELEASE_PROCESS_RUNBOOK.md` §2.
- Une promotion de statut requiert **toujours** un rapport de revue versionné.
- Les tests Cloud staging ne sont pas reproductibles localement — ils ne bloquent pas les PRs docs.
