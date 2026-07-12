# RELEASE_PROCESS_RUNBOOK.md — Processus de release Enistere OS Foundation

> Référence : `CORE_SPECIFICATION.md`, `QUALITY_GATES_MATRIX.md`, `BRANCH_PROTECTION_RUNBOOK.md`,
> `docs/checklists/RELEASE_READINESS_CHECKLIST.md`, ADR-013, ADR-014.
> Dernière mise à jour : 2026-07-11 (Quality Core 5).

---

## 1. Clarification des concepts

Cinq actes distincts — confondre l'un avec l'autre est la principale source d'incohérence.

| Acte | Nature | Déclencheur | Preuve requise | Produit |
|---|---|---|---|---|
| **Merge sur `main`** | Technique | CI verte + PR approuvée | Checks CI (L1–L4) | Commit sur `main` |
| **Promotion de statut** | Gouvernance documentaire | Revue manuelle selon checklist | Rapport de revue versionné | Mise à jour `IMPLEMENTATION_MATRIX.md` |
| **Release Foundation** | Gouvernance globale | Décision humaine explicite | Toutes preuves assemblées | Notes de release versionnées + tag futur |
| **Staging validation** | Déploiement technique | SHA immutable depuis `main` | Rapport CC11 | `CC11_STAGING_OPERATIONAL_REPORT.md` |
| **Production** | Déploiement final | Hors périmètre V1 | — | — |

### 1.1 Merge sur `main`

Un merge est un **acte technique**, pas une release. Il requiert :

- PR avec description justifiant le changement
- CI complète verte (niveaux 1–4 selon le type de PR)
- Revue humaine
- Gates Quality Core minimaux verts en local

Un merge ne constitue pas automatiquement une release, même si tous les cores sont `VALIDE_V1`.

### 1.2 Promotion de statut d'un core

Une promotion de statut (`IMPLEMENTATION_PARTIELLE` → `VALIDE_V1`, etc.) est un **acte de gouvernance
documentaire**. Elle requiert un rapport de revue versionné dans `docs/project-status/` et la mise à
jour de `IMPLEMENTATION_MATRIX.md`. Elle ne produit pas de tag ni de release GitHub.

Voir `docs/checklists/CORE_STATUS_REVIEW_CHECKLIST.md`.

### 1.3 Release Foundation

Une release Foundation est un **acte de gouvernance global**. Elle affirme que l'ensemble de la
fondation — ou un périmètre explicitement défini — atteint un niveau de qualité documenté et reproductible.

**Une release Foundation n'est pas un simple merge.** Elle requiert :

- Des preuves assemblées (gates exécutés, statuts vérifiés)
- Des notes de release rédigées
- Un tag Git coordonné (convention §7)
- Un billet de release GitHub (action humaine — non automatisé en V2)

### 1.4 Staging validation

Une validation staging est un **acte de déploiement technique** sur l'environnement `staging.enistere.com`.
Elle ne produit pas de release, mais peut être un prérequis à une release `staging-candidate`.

Voir `cores/cloud/docs/CC11_OPERATIONAL_RUNBOOK.md`.

### 1.5 Production

Hors périmètre V1. L'ADR-013 prévoit des environnements protégés et un déploiement contrôlé pour V2/VF.

---

## 2. Règle fondamentale

> **Une release Foundation est un acte de gouvernance, pas un simple merge.**

Conséquences :

- Un core peut être `VALIDE_V1` sans qu'une release Foundation soit déclenchée.
- Des releases partielles (`core-v1-validation`) sont possibles sans release globale.
- Aucune release ne doit être déclarée si les preuves ne sont pas assemblées et versionnées.
- Le `CHANGELOG.md` est mis à jour **avant** la release, pas après.
- Une release implique toujours un humain — aucune automatisation ne crée une release sans validation explicite.

---

## 3. Types de release

### 3.1 `foundation-v1-baseline`

**Périmètre** : première release complète de la fondation — snapshot cohérent de tous les cores V1.

**Critères minimum** :
- API Core NestJS : `VALIDE_V1` ou `IMPLEMENTATION_AVANCEE` avec rapport de revue
- Web Core Next.js : `VALIDE_V1` avec rapport de revue
- UI Kit : `VALIDE_V1` avec rapport de revue
- `@enistere/api-contracts` + `@enistere/api-client-fetch` : `IMPLEMENTATION_AVANCEE`
- CI niveaux 1–4 : verts sur `main`
- `npm audit` : 0 vuln
- Protection de branche `main` : activée (selon `BRANCH_PROTECTION_RUNBOOK.md`)
- `CHANGELOG.md` : à jour avec toutes les entrées V1

**Gates attendus** :
- `node cores/quality-core/scripts/quality-gates.mjs run all-safe` — 17/17 ✓
- CI L1 (`api-contracts` / `api-client-fetch` / `ui-kit` / `web-nextjs` / `audit`) ✓
- CI L2 (`api-runtime`) ✓
- CI L3 (`web-e2e`) ✓
- CI L4 (`api-smoke` / `images`) ✓

**Ce que cette release ne couvre pas** : Mobile Core (RN31 bloqué Linux), cores documentaires, staging production.

---

### 3.2 `core-v1-validation`

**Périmètre** : validation officielle d'un core individuel à son premier niveau V1.

**Exemples** :
- `core-api-v1` — API Core NestJS VALIDE_V1
- `core-web-v1` — Web Core Next.js VALIDE_V1
- `core-ui-kit-v1` — UI Kit VALIDE_V1

**Critères** :
- `CORE_SPECIFICATION.md` du core : critères de validation vérifiés un par un
- Rapport de revue versionné dans `docs/project-status/`
- Gates locaux du core : tous verts
- CI couvrant le core : verte
- Aucune régression dans les cores dépendants

**Gates attendus** : selon le core — voir `docs/checklists/RELEASE_READINESS_CHECKLIST.md` Partie 2.

---

### 3.3 `quality-v2-increment`

**Périmètre** : livraison d'un incrément documentaire ou outillage Quality Core (QC1–QCN).

**Critères** :
- Aucun workflow GitHub modifié
- Aucune dépendance ajoutée
- Aucun changement runtime
- `node --test cores/quality-core/scripts/quality-gates.test.mjs` : 36/36 ✓
- `node cores/quality-core/scripts/quality-gates.mjs plan docs` : plan affiché ✓
- `npm audit` 0 vuln, `git diff --check` 0 erreur

**Exemples** : QC1 (matrice), QC2 (scripts), QC3 (runbook branche), QC4 (templates), QC5 (release process).

---

### 3.4 `staging-candidate`

**Périmètre** : validation complète sur l'environnement staging avant décision de production.

**Critères** :
- SHA immutable depuis `main` (tag `sha-<short>` GHCR)
- CI complète verte sur ce SHA
- `CC11_STAGING_OPERATIONAL_REPORT.md` versionné avec : health HTTPS ×3, TLS, backup PG, backup MinIO, rollback, roll-forward
- Aucun secret dans les logs ou rapports
- Rapport de validation daté et signé

**Ce que cette release n'est pas** : un déploiement production. Elle documente un état staging validé.

---

### 3.5 `hotfix`

**Périmètre** : correction urgente d'un bug critique ou d'une vulnérabilité sécurité.

**Critères** :
- PR dédiée avec justification explicite du caractère urgent
- CI complète verte (pas de raccourci sur les checks)
- `npm audit` 0 vuln après le fix
- Impact sécurité évalué et documenté
- Notes de release courtes mais précises : symptôme, cause, fix, périmètre

**Ce qui est interdit** : bypasser les checks CI (`--no-verify`), merger sans revue, ajouter du code hors périmètre du fix.

---

## 4. Prérequis généraux

À vérifier avant toute release, quel que soit le type.

### 4.1 État de `main`

- [ ] `git status` — aucun fichier modifié non commité
- [ ] `git log origin/main..HEAD` — vide (branche locale alignée avec `origin/main`)
- [ ] Aucune PR ouverte critique bloquante non fusionnée

### 4.2 CI

- [ ] Dernier commit sur `main` : CI L1 verte (`api-contracts` / `api-client-fetch` / `ui-kit` / `web-nextjs` / `audit`)
- [ ] CI L2 verte (`api-runtime`)
- [ ] CI L3 verte (`web-e2e`)
- [ ] CI L4 verte (`api-smoke` / `images`) — si la release inclut des composants runtime

### 4.3 Qualité locale

- [ ] `npm audit` root — 0 vulnérabilité
- [ ] `git diff --check` — 0 whitespace error
- [ ] `node cores/quality-core/scripts/quality-gates.mjs run all-safe` — 17/17 ✓ (selon scope)

### 4.4 Documentation

- [ ] `CHANGELOG.md` : entrée dans `[Unreleased]` à jour avec tous les changements de la release
- [ ] `FOUNDATION_CURRENT_STATE.md` : reflète l'état réel, aucune ligne périmée
- [ ] `IMPLEMENTATION_MATRIX.md` : tous les statuts cohérents avec les preuves
- [ ] `NEXT_ACTIONS.md` : étapes terminées cochées, prochaine action identifiée
- [ ] `SESSION_HANDOFF.md` : §8 à jour

### 4.5 Sécurité

- [ ] Aucun secret, token, URL signée, PII dans les docs, logs ou CHANGELOG
- [ ] Aucune variable d'environnement de production exposée

### 4.6 Cloud / staging

- [ ] Aucun test Cloud réel effectué, sauf si la release est de type `staging-candidate`
- [ ] Si `staging-candidate` : rapport CC11 versionné et daté

---

## 5. Procédure de préparation

> Helper local disponible : `node cores/quality-core/scripts/release-helper.mjs draft ...`.
> Il génère un brouillon Markdown sur stdout uniquement. Il ne remplace pas la revue humaine et ne crée
> aucun tag ni GitHub Release.

### Étape 1 — Choisir le type et le scope de la release

Identifier parmi les 5 types (§3) lequel correspond à la situation.

Documenter dans les notes de release :
- Type : `foundation-v1-baseline` / `core-v1-validation` / `quality-v2-increment` / `staging-candidate` / `hotfix`
- Scope : liste des cores / packages / composants inclus
- Exclusions justifiées : ce qui n'est **pas** couvert et pourquoi

### Étape 2 — Lister les commits depuis la dernière release ou depuis `main`

```bash
# Depuis le dernier tag (si un tag existe)
git log <dernier-tag>..HEAD --oneline

# Ou depuis un commit de référence connu
git log <sha-référence>..HEAD --oneline
```

Si aucun tag n'existe encore, partir du commit initial ou du premier commit significatif.

### Étape 3 — Relire les documents project-status

- `docs/project-status/FOUNDATION_CURRENT_STATE.md`
- `docs/project-status/IMPLEMENTATION_MATRIX.md`

Vérifier que chaque statut dans la matrice est **cohérent avec les preuves** citées (tests passés,
rapport de revue, CI verte). Corriger toute incohérence avant de créer la release.

### Étape 4 — Sélectionner les gates Quality Core appropriés

Selon le scope de la release :

| Scope release | Scope Quality Core recommandé |
|---|---|
| docs-only, quality-core-only | `docs` + `root-audit` |
| packages (api-contracts, api-client-fetch) | `packages` + `root-audit` |
| UI Kit | `ui-kit` + `root-audit` |
| Web Core | `web` + `packages` + `ui-kit` + `root-audit` = `all-safe` |
| Mobile Core (partiel) | `mobile-static` + `root-audit` |
| Tous cores locaux sûrs | `all-safe` (17 étapes) |
| Release globale Foundation | `all-safe` + CI L1–L4 verts |

```bash
# Voir le plan avant d'exécuter
node cores/quality-core/scripts/quality-gates.mjs plan all-safe

# Exécuter
node cores/quality-core/scripts/quality-gates.mjs run all-safe
```

### Étape 5 — Vérifier les exclusions justifiées

Documenter dans les notes de release les gates **non exécutés** et la raison :

| Gate exclu | Raison |
|---|---|
| `smoke:ios` | Machine Linux — RN31 bloqué macOS/Xcode |
| `smoke:android` | Émulateur non disponible en CI standard |
| `test:e2e` (api-nestjs) | PostgreSQL + MinIO requis — non exécuté localement |
| E2E Playwright | Stack réelle requise — couvert par CI L3 |
| Tests Cloud staging | Runbook CC11 — hors scope release documentaire |

### Étape 6 — Rédiger les notes de release

Utiliser le format §6 ci-dessous.

### Étape 7 — Ouvrir la PR de release

La PR de release est une PR normale. Elle contient :
- Le `CHANGELOG.md` mis à jour (section `[Unreleased]` → section versionnée)
- Les mises à jour `IMPLEMENTATION_MATRIX.md` si des statuts changent
- Les notes de release dans la description de la PR

### Étape 8 — Après merge : tag et billet GitHub (action humaine)

Après merge de la PR de release sur `main` :

1. Créer le tag Git selon la convention §7 :
   ```bash
   git tag -a quality-v2.5 -m "Quality Core 5 — release process runbook"
   git push origin quality-v2.5
   ```
2. Créer le billet GitHub Release avec les notes de release.
3. Mettre à jour `NEXT_ACTIONS.md` avec la date et le tag.

> ⚠️ Ne pas créer de tag avant le merge sur `main`. Ne pas créer de GitHub Release sans revue humaine.

---

## 6. Format recommandé des notes de release

```markdown
## [quality-v2.5] — 2026-07-11

### Résumé

Une phrase décrivant l'essentiel de la release.

### Cores impactés

- Quality Core : `SPECIFICATION_DOCUMENTAIRE` (QC5 — processus de release documenté)
- (autres cores si applicable)

### Changements fonctionnels

- Ajout de `cores/quality-core/RELEASE_PROCESS_RUNBOOK.md` — 5 types de release, 8 étapes de préparation
- Mise à jour `docs/checklists/RELEASE_READINESS_CHECKLIST.md` — section Foundation Release

### Sécurité / gouvernance

- Aucun secret ajouté
- Aucun workflow modifié
- (mentionner tout changement impactant la sécurité ou la gouvernance)

### Migrations / breaking changes

- Aucun
- (ou : décrire les migrations nécessaires si applicable)

### Gates exécutés

| Gate | Résultat |
|---|---|
| `node cores/quality-core/scripts/quality-gates.mjs run docs` | ✓ |
| `npm audit` root | 0 vuln ✓ |
| `git diff --check` | 0 erreur ✓ |
| `node --test cores/quality-core/scripts/quality-gates.test.mjs` | 36/36 ✓ |

### Gates non exécutés

| Gate | Raison |
|---|---|
| `smoke:ios` | Linux — RN31 bloqué |
| E2E Playwright | Stack réelle — couvert CI L3 |

### Limites connues

- Protection de branche `main` : active via GitHub Rulesets (`protect-main`, 8 checks requis)
- Mobile RN31 : iOS smoke bloqué macOS/Xcode

### Prochaine action

Prochaine action : préparer les notes de release `foundation-v1-baseline` si la revue
`FOUNDATION_V1_BASELINE_READINESS_REVIEW.md` conclut `READY_FOR_RELEASE_DECISION`. Le tag reste une
décision humaine explicite.
```

---

## 7. Convention de tagging futur

> ⚠️ **Aucun tag n'est créé dans cette mission.** La convention ci-dessous est proposée et doit être
> validée par le mainteneur avant le premier tag réel. Elle peut évoluer.

### 7.1 Conventions proposées

| Périmètre | Format | Exemple |
|---|---|---|
| Foundation globale | `foundation-vX.Y.Z` | `foundation-v1.0.0` |
| Core Web Next.js | `core-web-vX.Y.Z` | `core-web-v1.0.0` |
| UI Kit | `core-ui-kit-vX.Y.Z` | `core-ui-kit-v1.0.0` |
| Core API NestJS | `core-api-vX.Y.Z` | `core-api-v1.0.0` |
| Core Mobile RN | `core-mobile-vX.Y.Z` | `core-mobile-v1.0.0` |
| Quality Core incrément | `quality-vX.N` | `quality-v2.5` |
| Staging candidate | `staging-YYYYMMDD-sha` | `staging-20260711-5bf4c0f` |
| Hotfix | `hotfix-vX.Y.Z-NNN` | `hotfix-v1.0.1-001` |

### 7.2 Règles SemVer

- **Majeure (X)** : breaking change — rupture de compatibilité entre cores ou packages
- **Mineure (Y)** : nouvelle fonctionnalité rétrocompatible
- **Patch (Z)** : correction de bug, hotfix, correction documentaire

### 7.3 Règles de tagging

- Tags créés **uniquement sur des commits `main`** (jamais sur une branche feature)
- Tags **annotés** (`git tag -a`) avec message décrivant la release
- Tags **immuables** — ne jamais déplacer un tag existant
- Tags **poussés explicitement** (`git push origin <tag>`) — jamais via `--follow-tags` par défaut
- Convention à valider avant le premier tag réel — ouvrir une PR de décision si besoin

### 7.4 Relation tags / GHCR

Les images GHCR utilisent `sha-<short>` (immuable) + `main-<short>`. Les tags de release Foundation
ne sont **pas** automatiquement des tags d'image GHCR — la correspondance doit être documentée
dans les notes de release (`sha-X correspond à release foundation-vY.Z`).

---

## 8. Relation avec les gates Quality Core

| Type de release | Scope quality-gates | CI requise | Staging requis |
|---|---|---|---|
| `foundation-v1-baseline` | `all-safe` (17 étapes) | L1+L2+L3+L4 | Recommandé |
| `core-v1-validation` | Selon le core | Selon le core | Non |
| `quality-v2-increment` | `docs` + `root-audit` | Non (docs-only) | Non |
| `staging-candidate` | `all-safe` | L1+L2+L3+L4 | Requis (rapport CC11) |
| `hotfix` | Selon le périmètre | L1+L2 minimum | Non (sauf si critique) |

---

## 9. Ce que ce runbook ne couvre pas

- La création effective de releases GitHub (acte humain — hors automatisation V2)
- La publication npm des packages (`@enistere/ui-kit`, `@enistere/api-contracts`, `@enistere/api-client-fetch`)
- Le déploiement production (hors périmètre V1)
- Les environnements protégés GitHub (futur ADR)
- La génération automatique du changelog (roadmap §13.2 — différé)
- Les prompts IA automatisés/RAG (ADR-022 — différé)
