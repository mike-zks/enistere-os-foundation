# QUALITY_CORE_REQUIRED_CHECKS_ALIGNMENT.md

> Date : 2026-07-12  
> Mission : Quality Core CI-required checks alignment  
> Périmètre : gouvernance Quality Core / CI, sans modification de workflow ni de ruleset.

## 1. Objectif

Vérifier si les deux checks Registry CI `images (...)`, actuellement recommandés phase 2, doivent rester
recommandés ou être proposés comme checks requis dans le ruleset `protect-main`.

Cette mission ne modifie pas le ruleset GitHub. Toute activation reste une action humaine/admin explicite.

## 2. Sources vérifiées

- `strategy/04_ROADMAP_GLOBAL.md` — V2 : industrialisation, CI/CD, tests, versioning.
- `cores/quality-core/CORE_SPECIFICATION.md` — rôle non-runtime, pas de workflow/ruleset implicite.
- `cores/quality-core/BRANCH_PROTECTION_RUNBOOK.md` — noms exacts des 10 checks.
- `cores/quality-core/QUALITY_GATES_MATRIX.md` — matrice des gates L1-L4.
- `.github/workflows/README.md` — workflows CI et statut ruleset.
- GitHub Ruleset `protect-main` via API GitHub.
- Registry CI PR #106 via `gh run view 29209012769`.

## 3. État réel du ruleset

Ruleset : `protect-main`.

État vérifié :

| Propriété | Valeur |
|---|---|
| Enforcement | `active` |
| Cible | `~DEFAULT_BRANCH` |
| Pull Request obligatoire | oui |
| Conversations résolues obligatoires | oui |
| Status checks stricts | oui |
| Checks requis | 8 |

Checks requis actuels :

1. `api-client-fetch`
2. `api-contracts`
3. `api-runtime`
4. `ui-kit`
5. `web-e2e`
6. `web-nextjs`
7. `audit`
8. `api-smoke`

Les deux checks `images (...)` ne sont pas requis actuellement.

## 4. État réel des jobs Registry CI

Run vérifié : Registry CI de la PR #106, `29209012769`, conclusion `success`.

| Job | Résultat | Durée observée | Rôle |
|---|---:|---:|---|
| `api-smoke` | success | 1m45s | Build image API + exécution smoke runtime Prisma |
| `images (api-nestjs, ./cores/api-nestjs, ./cores/api-nestjs/Dockerfile)` | success | 17s | Constructibilité image API, sans push en PR |
| `images (web-nextjs, ., ./cores/web-nextjs/Dockerfile)` | success | 26s | Constructibilité image Web, sans push en PR |

Constat : les deux jobs `images (...)` sont stables sur le run observé et peu coûteux sur cette exécution.

## 5. Analyse

### Arguments pour les rendre requis

- Ils ferment l'angle mort "Dockerfile cassé mais CI applicative verte", surtout pour l'image Web.
- Ils sont déjà produits par `registry-ci.yml` sur chaque PR.
- Ils n'ajoutent aucun secret, aucun déploiement et aucun push GHCR sur PR.
- Le temps observé sur PR #106 est faible.
- Ils rapprochent ADR-013/014 d'une gouvernance L4 plus stricte.

### Arguments pour ne pas les activer automatiquement

- Les noms de checks matrix sont longs et couplés aux valeurs `matrix` du workflow.
- Toute activation du ruleset est une action administrative qui peut bloquer les merges si les noms changent.
- `api-smoke` couvre déjà le build et l'exécution minimale de l'image API.
- La décision doit rester humaine, conformément au runbook et au périmètre non-runtime du Quality Core.

## 6. Décision

Décision : **PROMOTION_RECOMMANDÉE, NON_APPLIQUÉE**.

Les deux checks `images (...)` doivent être considérés comme candidats mûrs pour devenir requis dans
`protect-main`, mais le ruleset n'est pas modifié par cette mission.

Action humaine recommandée, si l'équipe accepte le coût et la fragilité des noms matrix :

- ajouter `images (api-nestjs, ./cores/api-nestjs, ./cores/api-nestjs/Dockerfile)` aux checks requis ;
- ajouter `images (web-nextjs, ., ./cores/web-nextjs/Dockerfile)` aux checks requis ;
- relancer une PR docs-only de vérification et confirmer que les 10 checks bloquent correctement le merge.

## 7. Hors périmètre confirmé

- Aucun workflow GitHub modifié.
- Aucun ruleset GitHub modifié.
- Aucune dépendance ajoutée.
- Aucun runtime API/Web/Mobile/UI Kit/Cloud modifié.
- Aucun accès serveur/staging.
- Aucun secret manipulé.

## 8. Prochaine action recommandée

Quality Core coverage standardization decision : décider si les scopes sans coverage standardisée
(`api-contracts`, `api-client-fetch`, `ui-kit`, `mobile-react-native`, `quality-core`, `docs-core`) doivent
recevoir une commande coverage locale, ou si le baseline actuel reste volontairement informatif.
