# QUALITY_WEB_ANGULAR_CI_GATE_REPORT.md — Gate CI Web Angular

**Date** : 2026-07-16  
**Mission** : Quality/Governance — gate CI `web-angular` dédié  
**Statut** : R2 Web Angular fermée

---

## 1. Objectif

Fermer la réserve R2 de `WEB_ANGULAR_V1_READINESS_REVIEW.md` : le Web Core Angular
était `VALIDE_V1`, mais ne disposait pas encore d'un check CI dédié.

---

## 2. Livrables

- `.github/workflows/web-angular-ci.yml`
  - Job `web-angular`.
  - Node 24.
  - `npm ci` dans `cores/web-angular`.
  - `npm run test:ci` (Karma / ChromeHeadless).
  - `npm run build`.
  - `npm audit`.
  - Lecture seule, aucun secret, aucun backend, aucun déploiement.
- `cores/quality-core/scripts/quality-gates.mjs`
  - Nouveau scope local `web-angular`.
  - Plan : `test:ci` → `build` → `audit`.
  - Scope séparé de `all-safe` car Karma/ChromeHeadless ouvre un port local.
- `cores/quality-core/scripts/quality-gates.test.mjs`
  - Couverture du nouveau scope.

---

## 3. Décision

La réserve R2 est fermée côté gouvernance : les PRs Angular disposent maintenant d'un
check CI dédié nommé **`web-angular`**.

Le check n'est pas ajouté automatiquement au ruleset `protect-main` dans cette mission :
l'activation comme check requis reste une action humaine GitHub Settings / Rulesets, comme
documenté par le Quality Core.

---

## 4. Vérifications

- `node --test cores/quality-core/scripts/quality-gates.test.mjs` ✅
- `node cores/quality-core/scripts/quality-gates.mjs plan web-angular` ✅
- `node cores/quality-core/scripts/quality-gates.mjs run web-angular` ✅
- `node cores/quality-core/scripts/quality-gates.mjs run docs` ✅
- `git diff --check` ✅
