# BRANCH_PROTECTION_RUNBOOK.md — Procédure d'activation de la protection de branche `main`

> **Statut courant : documenté, non appliqué.**
> La protection de branche est documentée (Cloud Core 4, ADR-013) mais non activée :
> son application est une action humaine requise dans l'interface GitHub.
>
> Ce runbook décrit la procédure exacte, les noms de checks exacts, les options recommandées
> et la checklist de vérification post-activation.
>
> Dernière mise à jour : 2026-07-11 (Quality Core 3).

---

## 1. Pourquoi protéger `main`

Sans protection, un push direct peut contourner tous les checks CI et merger du code
non testé. La protection de `main` garantit que :

- toute modification passe par une Pull Request ;
- les checks CI requis sont verts avant de permettre le merge ;
- aucune régression ne peut atteindre `main` sans être détectée.

La CI est déjà en place (niveaux 1–4, tous verts). L'activation de la protection de branche
est la dernière étape documentée de l'ADR-013 pour le scope "checks requis".

---

## 2. Prérequis

- Accès admin au repository GitHub (`mike-zks/enistere-os-foundation`).
- Au moins une PR récente avec tous les checks CI verts (pour que les check names
  apparaissent dans la liste GitHub).
- Les 4 workflows sont actifs et déclenchés sur `pull_request` :
  - `ci.yml` → jobs `api-contracts`, `api-client-fetch`, `ui-kit`, `web-nextjs`, `audit`
  - `api-runtime-ci.yml` → job `api-runtime`
  - `web-e2e-ci.yml` → job `web-e2e`
  - `registry-ci.yml` → jobs `api-smoke`, `images (…)` (matrix)
- Aucun secret supplémentaire n'est nécessaire — tous les workflows utilisent le
  `GITHUB_TOKEN` automatique ou des valeurs de test jetables définies dans le workflow.

---

## 3. Noms exacts des checks à rendre requis

> Le nom d'un status check GitHub correspond au **`name:` du job** dans le workflow YAML,
> **pas** au `name:` du workflow lui-même. Renommer un job casse l'exigence (nouveau check
> non connu, ancien non produit) → ne pas renommer les jobs sans mettre à jour ce runbook.

### 3.1 Checks de la CI L1 (`ci.yml`)

| Nom exact du check | Job YAML | Vérifie |
|---|---|---|
| `api-contracts` | `jobs.api-contracts` | generate:check, typecheck, build, test (12) |
| `api-client-fetch` | `jobs.api-client-fetch` | typecheck, build, test (30) |
| `ui-kit` | `jobs.ui-kit` | tokens:check, typecheck, build, lint, test (181), pack:check |
| `web-nextjs` | `jobs.web-nextjs` | typecheck, lint, test (450), build sans API |
| `audit` | `jobs.audit` | npm audit 0 vuln + gardes Axios/Zustand |

### 3.2 Checks de la CI L2 (`api-runtime-ci.yml`)

| Nom exact du check | Job YAML | Vérifie |
|---|---|---|
| `api-runtime` | `jobs.api-runtime` | migrations Prisma, lint, test unitaires (386), e2e (101) PG+MinIO, openapi:check, build |

### 3.3 Checks de la CI L3 (`web-e2e-ci.yml`)

| Nom exact du check | Job YAML | Vérifie |
|---|---|---|
| `web-e2e` | `jobs.web-e2e` | 15 tests E2E Playwright (Health/Auth/Files, stack réelle API+PG+MinIO+Web) |

### 3.4 Checks de la CI L4 (`registry-ci.yml`)

| Nom exact du check | Job YAML | Vérifie |
|---|---|---|
| `api-smoke` | `jobs.api-smoke` | build image API + smoke runtime Prisma (sans base) |
| `images (api-nestjs, ./cores/api-nestjs, ./cores/api-nestjs/Dockerfile)` | `jobs.images` (matrix) | build image API (constructibilité en PR, sans push) |
| `images (web-nextjs, ., ./cores/web-nextjs/Dockerfile)` | `jobs.images` (matrix) | build image Web (constructibilité en PR, sans push) |

> **Note matrix** : le job `images` utilise une `strategy.matrix` avec deux entrées. GitHub
> génère un check distinct par entrée de matrice, avec un nom composé : `<job-name> (<matrix.name>, <matrix.context>, <matrix.file>)`. Ces noms sont stables tant que les valeurs de matrice ne changent pas.

---

## 4. Classification des checks

### 4.1 Checks requis immédiats (recommandés dès maintenant)

Ces checks sont légers, déjà verts en CI, et couvrent la non-régression core :

| Check | Workflow | Durée typique | Justification |
|---|---|---|---|
| `api-contracts` | L1 | ~1 min | Gate contrat OpenAPI — toute dérive détectée |
| `api-client-fetch` | L1 | ~1 min | Gate client officiel — compatible contracts |
| `ui-kit` | L1 | ~2 min | Gate design tokens + 181 tests a11y |
| `web-nextjs` | L1 | ~3 min | Gate Web Core VALIDE_V1 — 450 tests + build |
| `audit` | L1 | ~1 min | Gate 0 vulnérabilité + gardes Axios/Zustand |
| `api-runtime` | L2 | ~4 min | Gate runtime API NestJS (PG+MinIO jetables) |
| `web-e2e` | L3 | ~5 min | Gate E2E navigateur (15 parcours Playwright) |
| `api-smoke` | L4 | ~3 min | Gate image API boot + moteur Prisma chargé |

**Total recommandé** : 8 checks. Durée totale parallèle maximale : ~5 min (L3 = bottleneck).

### 4.2 Checks recommandés mais coûteux (optionnels en première phase)

| Check | Workflow | Durée typique | Justification d'exclusion temporaire |
|---|---|---|---|
| `images (api-nestjs, ...)` | L4 | ~4 min | Build image = Docker layer cache — ralentit PR sans apport critique si `api-smoke` est requis |
| `images (web-nextjs, ...)` | L4 | ~4 min | Idem ; image Web build = déjà couvert par `web-nextjs` typecheck/lint/test/build |

> **Recommandation** : ajouter les deux checks `images (…)` dès que le workflow `registry-ci.yml`
> est stable et que les PRs sont fréquentes. Ils garantissent que les images restent
> constructibles à chaque PR, pas seulement au push sur `main`.

### 4.3 Non requis — gates finaux staging / mobile device (hors CI)

Ces gates ne peuvent pas être des required checks GitHub car ils ne s'exécutent pas en CI PR :

| Gate | Raison d'exclusion |
|---|---|
| Cloud/staging CC11 (health HTTPS, backup, rollback) | Nécessite un VPS staging réel + SSH — non reproductible en CI runner |
| `smoke:android` (émulateur Android) | Nécessite un émulateur Android — non disponible en runner standard |
| `smoke:ios` (simulateur iOS) | Nécessite macOS + Xcode + simulateur — RN31 bloqué Linux |
| `expo export -p ios` | Metro bundle — trop lent pour required check (>10 min) |

---

## 5. Procédure d'activation — GitHub UI (manuel)

**URL** : `https://github.com/mike-zks/enistere-os-foundation/settings/branches`

### 5.1 Ouvrir les paramètres

1. Aller dans **Settings** du repository.
2. Cliquer sur **Branches** dans le menu latéral gauche.
3. Cliquer sur **Add branch ruleset** ou, si une règle `main` existe déjà, cliquer sur **Edit**.

> **Alternative** : via **Branch protection rules** (ancienne interface) → **Add rule** → entrer `main`.

### 5.2 Options à configurer

#### Option A — Require a pull request before merging ✅ (recommandé)

```
☑ Require a pull request before merging
  ☐ Require approvals         (optionnel — 0 à 1 reviewer selon équipe)
  ☐ Dismiss stale reviews     (optionnel — à activer quand équipe > 1)
  ☐ Require review from code owners (optionnel)
```

**Justification** : empêche tout push direct sur `main`. Toute modification passe par PR.

#### Option B — Require status checks to pass before merging ✅ (requis)

```
☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging  → voir §5.3
```

Dans le champ de recherche de checks, ajouter **dans cet ordre** :

1. `api-contracts`
2. `api-client-fetch`
3. `ui-kit`
4. `web-nextjs`
5. `audit`
6. `api-runtime`
7. `web-e2e`
8. `api-smoke`

Optionnel (phase 2) :
- `images (api-nestjs, ./cores/api-nestjs, ./cores/api-nestjs/Dockerfile)`
- `images (web-nextjs, ., ./cores/web-nextjs/Dockerfile)`

> **Attention** : les noms de checks n'apparaissent dans la liste de recherche que si une
> exécution récente a produit ce check sur le repository. Si un check n'apparaît pas,
> ouvrir une PR de test, laisser les workflows tourner, puis revenir configurer.

#### Option C — Require branches to be up to date before merging

```
☑ Require branches to be up to date before merging    → recommandé avec réserve
```

**Recommandation** : activer dès que l'équipe est > 1 et que les PRs sont fréquentes, pour
éviter les merge de branche stale dont les checks passaient sur un état antérieur de `main`.

**Coût** : chaque nouveau merge sur `main` invalide les PR en cours et force un rebase +
re-run CI. Pour une équipe solo ou un repository à faible volume de PRs simultanées,
le coût est faible et le bénéfice réel. **Décision : activer.**

#### Option D — Do not allow bypassing the above settings

```
☐ Do not allow bypassing the above settings   → différé
```

**Recommandation** : **ne pas activer en première phase**. Cette option empêche les
administrateurs de bypasser la protection, y compris pour corriger une urgence. À activer
uniquement quand l'équipe a une procédure de hotfix documentée (branche dédiée, CI fast).

#### Option E — Règles administrateurs

Sans l'option D, les administrateurs peuvent bypasser les règles. C'est la configuration
recommandée pour une équipe solo ou en phase de démarrage : les admins gardent le contrôle
en cas d'urgence tout en bénéficiant des gates en conditions normales.

**Décision humaine requise** : évaluer si la politique "admins inclus dans les règles" est
adaptée à la maturité et à la taille de l'équipe.

### 5.3 Cliquer sur Save changes / Create

La protection prend effet immédiatement. Les PRs ouvertes sont soumises aux nouvelles règles.

---

## 6. Checklist de vérification post-activation

Après avoir cliqué "Save changes", vérifier que la protection fonctionne correctement.

### 6.1 Vérification via une PR de test (docs-only)

```bash
# Créer une branche de test minimaliste
git checkout -b test/branch-protection-verify
echo "# test" >> cores/quality-core/BRANCH_PROTECTION_RUNBOOK.md
git add cores/quality-core/BRANCH_PROTECTION_RUNBOOK.md
git commit -m "test: branch protection verification (à supprimer)"
git push -u origin test/branch-protection-verify
# Ouvrir une PR vers main depuis GitHub
```

### 6.2 Points à vérifier dans l'interface GitHub de la PR

- [ ] La PR affiche la section **"Checks"** avec les noms attendus
- [ ] Le bouton **Merge pull request** est grisé tant que les checks sont `pending` ou `failing`
- [ ] Chaque check attendu apparaît avec son nom exact (§3) — aucun check manquant, aucun nom différent
- [ ] Après que tous les checks passent, le bouton Merge devient actif
- [ ] Un push direct sur `main` est bloqué : `! [remote rejected] main -> main (protected branch hook declined)`

### 6.3 Vérifier les noms des checks

Si un check apparaît avec un nom inattendu :

1. Ouvrir l'onglet **Actions** du repository.
2. Trouver l'exécution correspondant à la PR.
3. Vérifier le `name:` du job dans le YAML du workflow — c'est le nom exact utilisé par GitHub.
4. Corriger la configuration de protection si nécessaire (§5.2 Option B).

### 6.4 Documenter l'activation

Si la protection est activée, mettre à jour :

- `docs/project-status/IMPLEMENTATION_MATRIX.md` — ligne ADR-013 : "protection de branche appliquée" avec date
- `docs/project-status/FOUNDATION_CURRENT_STATE.md` — ligne CI/CD
- `CHANGELOG.md` — entrée dans `[Unreleased]`
- Ce runbook — remplacer "documenté, non appliqué" par "ACTIVÉ (date)" dans l'en-tête

### 6.5 Supprimer la branche de test

```bash
git checkout main
git branch -D test/branch-protection-verify
git push origin --delete test/branch-protection-verify
```

---

## 7. Pourquoi aucun secret ni environnement protégé n'est nécessaire

La protection de branche **ne requiert aucun nouveau secret** car :

- Les workflows CI utilisent uniquement des valeurs de test jetables définies dans le YAML
  (jamais `secrets.*` pour les checks requis en PR).
- Le `GITHUB_TOKEN` automatique est disponible sans configuration — il sert au login GHCR
  **uniquement sur push `main`** (pas en PR).
- Les environnements protégés GitHub (secrets par environnement, approbations manuelles)
  sont une feature pour le **déploiement**, non pour les checks CI — hors périmètre ADR-013.

---

## 8. Relation avec ADR-013 et l'état courant

| Composant ADR-013 | Statut |
|---|---|
| CI Niveau 1 (`ci.yml`) | ✅ IMPLANTÉ — verts sur `main` |
| CI Niveau 2 (`api-runtime-ci.yml`) | ✅ IMPLANTÉ |
| CI Niveau 3 (`web-e2e-ci.yml`) | ✅ IMPLANTÉ |
| CI Niveau 4 partiel (`registry-ci.yml`) | ✅ IMPLANTÉ (sans déploiement) |
| Protection de branche `main` | ⏳ **DOCUMENTÉ, NON APPLIQUÉ** — action humaine requise |
| Couverture publiée | ❌ Non commencé |
| Release / versioning | ❌ Non commencé |
| Déploiement par environnement | ❌ Non commencé |

> La protection de branche est **la prochaine étape concrète et sans risque** d'ADR-013.
> Elle ne nécessite aucun code, aucune dépendance, aucun secret, aucun budget.
> C'est une action de 5 minutes dans l'interface GitHub.

---

## 9. Référence rapide — commandes de vérification locale préalable

Avant d'activer, s'assurer que les gates locaux passent :

```bash
# Plan des gates docs (vérification minimale)
node cores/quality-core/scripts/quality-gates.mjs plan docs

# Plan complet all-safe (vérification avant PR)
node cores/quality-core/scripts/quality-gates.mjs plan all-safe

# Tests du script quality-gates
node --test cores/quality-core/scripts/quality-gates.test.mjs

# Audit root
npm audit
```
