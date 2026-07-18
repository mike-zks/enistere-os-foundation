# GitHub — Checklist de protection de branche `main` (application manuelle)

> À appliquer **manuellement** dans **GitHub → Settings → Branches → Branch protection rules** (ou
> **Rulesets**). **Aucune application via l'API GitHub** (action humaine). Objectif : rendre **bloquants** avant
> merge les checks des **trois** workflows (`ci.yml`, `api-runtime-ci.yml`, `web-e2e-ci.yml`) et empêcher les
> écritures dangereuses sur `main`.

## Pré-requis

- Les **trois** workflows (`ci.yml`, `api-runtime-ci.yml`, `web-e2e-ci.yml`) ont tourné **au moins une fois**
  (sur `main` et/ou une PR) pour que leurs **checks** apparaissent dans la liste des status checks
  sélectionnables (GitHub ne propose que les checks déjà observés).
- Avoir les droits **admin** sur le dépôt `mike-zks/enistere-os-foundation`.

## Checks à exiger (noms exacts = noms des jobs)

> Le nom du status check **est le `name:` du job** (pas le nom du workflow). Vérifié dans le repository.

### Obligatoires dès maintenant (niveaux 1–3)

| Workflow | Job | Check à exiger | Rôle |
|---|---|---|---|
| `ci.yml` (CI) | `api-contracts` | **`api-contracts`** | OpenAPI `generate:check` + build/test contrats |
| `ci.yml` | `api-client-fetch` | **`api-client-fetch`** | build/test client Fetch |
| `ci.yml` | `ui-kit` | **`ui-kit`** | tokens/build/lint/test/pack UI Kit |
| `ci.yml` | `web-nextjs` | **`web-nextjs`** | typecheck/lint/test/build Web (sans API) |
| `ci.yml` | `audit` | **`audit`** | `npm audit` 0 vuln + gardes Axios/Zustand |
| `api-runtime-ci.yml` (API Runtime CI) | `api-runtime` | **`api-runtime`** | migrations + unit + **e2e** API (PostgreSQL+MinIO) |
| `web-e2e-ci.yml` (Web E2E CI) | `web-e2e` | **`web-e2e`** | **E2E navigateur** (Playwright : Health/Auth/Files) |

→ **7 checks** à cocher dans *Require status checks to pass before merging*.

**Recommandé (8ᵉ, Deployment 5)** : `registry-ci.yml` → job **`images`** (build des images Docker en PR, sans
push). À exiger si tu veux garantir que les images restent constructibles avant merge — au prix d'une PR un peu
plus lente (build Docker). Optionnel mais conseillé.

### Futurs (à exiger quand implémentés — ne pas exiger maintenant)

`coverage` (publication couverture, niveau 4+) · `security-scan` (scan dépendances/secrets) · `actionlint`
(lint des workflows) · `registry` / `deploy-staging` (niveau 4, ADR-014 — **non implémentés**).

## Règle sur `main`

Créer une **Branch protection rule** (pattern : `main`) et cocher :

- [ ] **Require a pull request before merging** (interdit le push direct sur `main`).
  - [ ] *Require approvals* : **1** reviewer minimum — **recommandé** (activer quand l'équipe > 1 ; un solo
    mainteneur peut différer cette case sans bloquer le flux).
  - [ ] *Dismiss stale pull request approvals when new commits are pushed* — recommandé.
  - [ ] *Require review from Code Owners* — **plus tard** (quand un `CODEOWNERS` existera ; voir plus bas).
- [ ] **Require status checks to pass before merging**.
  - [ ] *Require branches to be up to date before merging* — recommandé.
  - [ ] Sélectionner les **7 checks** (cf. tableau ci-dessus) : `api-contracts`, `api-client-fetch`, `ui-kit`,
    `web-nextjs`, `audit` (de `ci.yml`) + `api-runtime` (de `api-runtime-ci.yml`) + `web-e2e` (de
    `web-e2e-ci.yml`).
- [ ] **Require conversation resolution before merging**.
- [ ] **Do not allow bypassing the above settings** (inclure les administrateurs — recommandé en V1 solo
  uniquement si cela ne bloque pas les correctifs urgents ; sinon laisser décoché et documenter).
- [ ] **Restrict who can push to matching branches** — optionnel (peu utile en solo).

## Interdictions (cases « Rules applied to everyone… »)

- [ ] **Allow force pushes** : **DÉSACTIVÉ** (force-push interdit — cohérent avec la gouvernance « jamais de
  force-push »).
- [ ] **Allow deletions** : **DÉSACTIVÉ** (suppression de `main` interdite).

## Historique linéaire — décision

- [ ] **Require linear history** : **à décider**. Recommandation : **activer** (merges en *squash* ou
  *rebase*) pour garder un historique lisible cohérent avec les commits conventionnels actuels
  (`feat(...)`/`docs(...)`/`ci:`). Si le flux de merge commits est préféré, laisser décoché — documenter le
  choix.

## CODEOWNERS — plus tard

- [ ] Créer `.github/CODEOWNERS` quand la propriété par dossier devient utile (ex. `starters/nextjs/ @…`,
  `packages/ @…`, `docs/adr/ @…`). **Non requis** en V1 ; activer ensuite *Require review from Code Owners*.

## Vérification après application

- [ ] Un push direct sur `main` est **refusé** (passe par PR).
- [ ] Une PR ne peut être mergée que si les **7 checks** (5 de `ci.yml` + `api-runtime` + `web-e2e`) sont verts.
- [ ] `git push --force origin main` est **rejeté** par GitHub.
- [ ] La branche `main` ne peut pas être supprimée.

## Attention — renommer un job casse l'exigence

Le check exigé est lié au **`name:` du job**. **Renommer** un job (ou son `name:`) crée un **nouveau** check
et **désactive** silencieusement l'exigence de l'ancien (la règle référence un check qui ne sera plus produit).
Si un `name:` de job change, **mettre à jour cette liste** et re-sélectionner le check dans la règle. Les noms
actuels (`api-contracts`/`api-client-fetch`/`ui-kit`/`web-nextjs`/`audit`/`api-runtime`/`web-e2e`) sont
**stables et non ambigus** — aucun renommage n'est nécessaire (ni effectué par Deployment 4).

> Note : la protection de branche est une garantie **GitHub** (serveur), complémentaire de la discipline
> locale. La CI reste l'autorité de validation ; ces règles la rendent **bloquante**. **Statut actuel : non
> appliquée** (action humaine en attente) — tant qu'elle ne l'est pas, un push direct sur `main` reste possible.
