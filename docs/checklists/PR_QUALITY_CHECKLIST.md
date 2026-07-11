# PR_QUALITY_CHECKLIST.md — Checklist qualité par type de PR

> Référence : `cores/quality-core/QUALITY_GATES_MATRIX.md`.
> Dernière mise à jour : 2026-07-11 (Quality Core 1).

## Comment utiliser cette checklist

1. Identifier le type de la PR dans la table ci-dessous.
2. Exécuter les gates minimaux **avant d'ouvrir la PR**.
3. Exécuter les gates recommandés si le type de PR le justifie.
4. Cocher les cases dans la description de la PR ou dans la revue.

---

## Checklist par type de PR

### docs-only (project-status, ADR, checklists, stratégie)

- [ ] `git diff --check` — pas de whitespace errors
- [ ] Liens internes cohérents (fichiers référencés existent)
- [ ] Statuts dans `IMPLEMENTATION_MATRIX.md` cohérents avec les preuves documentées
- [ ] `SESSION_HANDOFF.md` mis à jour si l'état courant change

Audit root recommandé mais non bloquant.

---

### quality-core-only (cette PR)

- [ ] `git diff --check` — pas de whitespace errors
- [ ] `npm audit` root — 0 vuln
- [ ] Aucun workflow GitHub modifié
- [ ] Aucune dépendance ajoutée
- [ ] Aucun changement runtime (API / Web / Mobile / UI Kit / Cloud)

---

### UI Kit

- [ ] `npm run typecheck --workspace=@enistere/ui-kit`
- [ ] `npm run lint --workspace=@enistere/ui-kit`
- [ ] `npm test --workspace=@enistere/ui-kit` — 181/181 verts (ou nouveau total)
- [ ] `npm run build --workspace=@enistere/ui-kit`
- [ ] `npm run tokens:check --workspace=@enistere/ui-kit` (si tokens modifiés)
- [ ] `npm audit` root — 0 vuln
- [ ] `git diff --check`
- [ ] `npm run pack:check --workspace=@enistere/ui-kit` (si release candidate)

---

### api-contracts

- [ ] `npm run typecheck --workspace=@enistere/api-contracts`
- [ ] `npm run build --workspace=@enistere/api-contracts`
- [ ] `npm run generate:check --workspace=@enistere/api-contracts` — pas de drift OpenAPI
- [ ] `npm test --workspace=@enistere/api-contracts` — 12/12 verts (ou nouveau total)
- [ ] `npm audit` root — 0 vuln
- [ ] `git diff --check`

---

### api-client-fetch

- [ ] `npm run typecheck --workspace=@enistere/api-client-fetch`
- [ ] `npm run build --workspace=@enistere/api-client-fetch`
- [ ] `npm test --workspace=@enistere/api-client-fetch` — 30/30 verts (ou nouveau total)
- [ ] `npm audit` root — 0 vuln
- [ ] `git diff --check`

---

### web-nextjs (Web Core)

- [ ] `npm run typecheck --workspace=@enistere/web-nextjs`
- [ ] `npm run lint --workspace=@enistere/web-nextjs`
- [ ] `npm test --workspace=@enistere/web-nextjs` — 450/450 verts (ou nouveau total)
- [ ] `npm run build --workspace=@enistere/web-nextjs` — build sans API
- [ ] `npm audit` root — 0 vuln
- [ ] `git diff --check`
- [ ] Tests E2E Playwright recommandés (nécessite stack API+PG+MinIO+Web) : `npx playwright test`

---

### mobile-react-native (Mobile Core)

- [ ] `npm run typecheck --workspace=mobile-react-native`
- [ ] `npm run lint --workspace=mobile-react-native`
- [ ] `npm test --workspace=mobile-react-native` — 367/367 verts (ou nouveau total)
- [ ] `npx expo export -p ios` — bundle iOS sans erreur
- [ ] `npx expo-doctor` — 19/19 checks (ou nouveau total)
- [ ] `npm audit` root — 0 vuln
- [ ] `git diff --check`
- [ ] `npm run smoke:android` recommandé (nécessite emulator Android `emulator-5554`)
- [ ] `npm run smoke:ios` si macOS disponible (bloqué Linux — RN31 en attente macOS/Xcode)

---

### api-nestjs (API Core)

- [ ] `npm run typecheck --workspace=api-nestjs`
- [ ] `npm run lint --workspace=api-nestjs`
- [ ] `npm run test --workspace=api-nestjs` — 386/386 verts (ou nouveau total)
- [ ] `npm run test:e2e --workspace=api-nestjs` — 101/101 verts (nécessite PostgreSQL + MinIO)
- [ ] `npm run openapi:check --workspace=api-nestjs` — pas de drift
- [ ] `npm run build --workspace=api-nestjs`
- [ ] `npm audit` root — 0 vuln
- [ ] `git diff --check`

---

### cloud (images, infra)

- [ ] `docker build -t enistere/api-nestjs .` (dans `cores/api-nestjs/`) — image API build
- [ ] `docker build -t enistere/web-nextjs .` (dans `cores/web-nextjs/`) — image Web build
- [ ] CI L4 (`registry-ci.yml`) — job `api-smoke` vert (gate push GHCR)
- [ ] `git diff --check`
- [ ] Tests staging (🔒 staging) : health HTTPS × 3, TLS, backup/restore — selon runbook CC11

---

### multi-core

Appliquer l'union des checklists des cores modifiés, plus :

- [ ] Vérifier qu'aucune dépendance circulaire n'a été introduite
- [ ] Vérifier que `npm audit` root passe après tous les changements
- [ ] CI niveau 1 doit passer (couvre api-contracts + api-client-fetch + ui-kit + web-nextjs + audit)

---

## Gates CI de référence

| Niveau | Workflow | Triggeré par |
|---|---|---|
| L1 | `ci.yml` | toute PR |
| L2 | `api-runtime-ci.yml` | toute PR |
| L3 | `web-e2e-ci.yml` | toute PR |
| L4 | `registry-ci.yml` | push `main` |

> Voir `.github/workflows/README.md` pour la description complète des 4 niveaux CI.
