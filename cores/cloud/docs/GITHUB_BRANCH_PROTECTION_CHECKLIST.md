# GitHub — Checklist de protection de branche `main` (application manuelle)

> À appliquer **manuellement** dans **GitHub → Settings → Branches → Branch protection rules** (ou
> **Rulesets**). **Cette mission n'applique rien via l'API GitHub.** Objectif : rendre la CI minimale
> (`.github/workflows/ci.yml`) **bloquante** avant merge, et empêcher les écritures dangereuses sur `main`.

## Pré-requis

- La CI (`ci.yml`) a tourné au moins une fois sur `main` pour que ses **checks** apparaissent dans la liste
  des status checks sélectionnables.
- Avoir les droits **admin** sur le dépôt `mike-zks/enistere-os-foundation`.

## Règle sur `main`

Créer une **Branch protection rule** (pattern : `main`) et cocher :

- [ ] **Require a pull request before merging** (interdit le push direct sur `main`).
  - [ ] *Require approvals* : **1** reviewer minimum — **recommandé** (activer quand l'équipe > 1 ; un solo
    mainteneur peut différer cette case sans bloquer le flux).
  - [ ] *Dismiss stale pull request approvals when new commits are pushed* — recommandé.
  - [ ] *Require review from Code Owners* — **plus tard** (quand un `CODEOWNERS` existera ; voir plus bas).
- [ ] **Require status checks to pass before merging**.
  - [ ] *Require branches to be up to date before merging* — recommandé.
  - [ ] Sélectionner les checks **CI** : `api-contracts`, `api-client-fetch`, `ui-kit`, `web-nextjs`, `audit`
    (les 5 jobs de `ci.yml`).
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

- [ ] Créer `.github/CODEOWNERS` quand la propriété par dossier devient utile (ex. `cores/web-nextjs/ @…`,
  `packages/ @…`, `docs/adr/ @…`). **Non requis** en V1 ; activer ensuite *Require review from Code Owners*.

## Vérification après application

- [ ] Un push direct sur `main` est **refusé** (passe par PR).
- [ ] Une PR ne peut être mergée que si les **5 checks CI** sont verts.
- [ ] `git push --force origin main` est **rejeté** par GitHub.
- [ ] La branche `main` ne peut pas être supprimée.

> Note : la protection de branche est une garantie **GitHub** (serveur), complémentaire de la discipline
> locale. La CI reste l'autorité de validation ; ces règles la rendent **bloquante**.
