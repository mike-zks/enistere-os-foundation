# ADR-078 — RBAC sur FastAPI, et la collision que la composition a révélée

- Statut : Validé et implémenté
- Date : 2026-07-30
- Décideur : Owner Foundation
- Complète : ADR-069 et ADR-077

## Contexte

FastAPI portait Authentication depuis ADR-077 mais restait `unsupported` sur
RBAC. La famille API n'était donc à parité que sur une capability sur trois.

Le terrain était prêt — `require_user` exporté, coutures posées, persistance et
migrations en place — ce qui a fait de cette mission la première où **le portage
lui-même n'a rien révélé, mais la composition à deux capabilities si**.

## Décision

### 1. La décision est lue en base, à chaque requête

Aucune revendication d'autorisation ne voyage dans le jeton d'accès. Un rôle
révoqué il y a une seconde doit être parti à la requête suivante, pas à la
prochaine connexion. C'est vérifié dans les deux sens sur **le même jeton** :
un octroi ouvre une route jusque-là refusée, une révocation la referme.

Le coût est une lecture par requête gardée. Il est assumé : une décision
d'autorisation périmée est une faille, pas une optimisation.

### 2. L'authentification est résolue avant l'autorisation

Les gardes dépendent de `require_user`. Un appelant anonyme reçoit **401, jamais
403** : répondre « interdit » à un anonyme lui apprend que la route existe et
qu'une habilitation l'ouvre.

### 3. Le refus est générique, l'audit ne l'est pas

La réponse ne nomme jamais l'habilitation manquante — la carte d'un modèle
d'autorisation vaut plus qu'un refus isolé. Mais un exploitant qui enquête sur un
refus doit savoir laquelle manquait : elle est donc enregistrée dans l'événement
`AUTHORIZATION_DENIED`, et nulle part ailleurs.

### 4. Deny-by-default, et rien n'est amorcé

Une route qui déclare une exigence est fermée tant que l'habilitation n'est pas
détenue ; une route qui n'en déclare aucune reste ouverte à tout principal
authentifié. La migration ne crée **aucun rôle ni permission** : livrer un rôle
`admin` serait livrer une politique d'autorisation que personne n'a choisie.

### 5. RBAC réutilise l'enveloppe d'erreur d'Authentication

`forbidden()` produit un `AuthError`, donc passe par le handler qu'Authentication
compose déjà. RBAC déclare `requires: ["auth"]` : la dépendance est explicite et
légitime. Un second type d'erreur signifierait un second handler produisant une
enveloppe identique au octet près, et deux endroits à tenir en phase.

## Le défaut que la composition a révélé

**Deux capabilities exportent `router`.** Le renderer FastAPI importait les
symboles sans alias :

```python
from app.auth import router
from app.authorization import router   # écrase le premier

CAPABILITY_ROUTERS = (router, router)  # le même, deux fois
```

L'application composée aurait enregistré RBAC deux fois et **perdu entièrement
les routes d'authentification**, sans erreur nulle part : ni à l'import, ni au
démarrage, ni au lint. Le seul symptôme aurait été un 404 sur `/api/v1/auth/login`
dans un projet livré.

Les renderers Angular et Flutter ont échappé au problème par chance — leurs
symboles étaient distincts (`AUTH_PROVIDERS`, `authInterceptorFactory`). C'est une
propriété du hasard, pas du contrat.

Les trois renderers Python aliasent désormais sur la queue du module
(`auth_router`, `authorization_router`) et **lèvent** si deux alias entrent
malgré tout en collision. Un test verrouille exactement le cas qui a échoué.

## Deux défauts de test, révélés eux aussi par la composition

- **Le test de migration d'Authentication supposait posséder tout le schéma.** Il
  vérifiait que chaque table déclarée figurait dans *sa* révision ; dès qu'une
  seconde capability contribue des tables, il échouait. Il parcourt désormais
  toutes les révisions : l'invariant honnête est que le schéma déclaré soit
  intégralement migré, quelle que soit la capability qui livre la migration.
- **Le harnais RBAC recréait une permission déjà existante.** Deux rôles
  accordant le même code est le cas ordinaire que le résumé doit dédupliquer ;
  le test le fabriquait mal.

## Deux gates ajoutés, dus depuis la semaine dernière

`nestjs-angular-auth` avait été nommé par un descripteur de conformance sans
exister nulle part — c'est ainsi qu'une composition Angular qui ne compilait pas
a atteint `main`. Deux invariants ferment le trou :

* le `golden` d'un descripteur de conformance doit exister dans `COMPOSITIONS` ;
* toute composition de `COMPOSITIONS` doit figurer dans la matrice CI.

Les deux sont éprouvés par canari dans les deux sens.

## Conséquences

### Acquis

* `rbac/fastapi` est `ready` : quatre responsabilités, six invariants, dix
  preuves. **La parité API est refermée sur RBAC** — les trois autorités tiennent
  4/4.
* `requires_role` / `requires_permission` sont exportés : Files protégera ses
  routes sans réimplémenter la lecture d'habilitation.
* Une classe entière de défaut de composition est désormais impossible sur les
  trois coutures Python.

### Assumé

* **Aucune API d'administration des rôles.** Créer un rôle, l'accorder, le
  révoquer se fait par la base ou par un outil du produit. Les deux autres
  autorités n'en offrent pas davantage ; ajouter cette surface est une décision
  produit, pas une exigence de parité.
* Une lecture en base par requête gardée, sans cache. Un cache introduirait une
  fenêtre pendant laquelle une révocation n'a pas encore pris effet.

### Non revendiqué

* **RBAC reste `planned` sur Angular et Flutter** ; l'écart de parité Web
  demeure déclaré.
* La décision n'est pas prouvée sous concurrence (octroi et refus simultanés).
* Aucune preuve de démarrage headless pour `fastapi-rbac`.

## Alternatives écartées

* **Porter les habilitations dans le jeton d'accès.** Supprime la lecture par
  requête, et rend toute révocation inopérante jusqu'à expiration.
* **Un type d'erreur et un handler propres à RBAC.** Deux chemins produisant la
  même enveloppe, à tenir en phase pour rien.
* **Amorcer un rôle `admin`.** Confort de démarrage contre une politique
  d'autorisation imposée.
* **Détecter la collision de symboles au lieu d'aliaser.** Ferait échouer une
  composition parfaitement légitime : deux capabilities ont le droit d'appeler
  leur routeur `router`.

## Tests

```bash
npm run factory:test                      # 497
npm run factory:capability-conformance    # rbac/fastapi CONFORMANT, parité API OK
node factory/quality/scripts/golden-runtime.mjs fastapi-rbac
```

Application composée réellement générée : `ruff` propre, **40/40 pytest** contre
un PostgreSQL réel, `compileall` et `pip check` verts. Les deux révisions Alembic
enchaînées sur une base vide (8 tables), puis l'autorisation exercée **sur ce
schéma migré** : résumé vide, refus 403, octroi, puis **200 avec le même jeton
d'accès**, et le déni enregistré avec l'habilitation manquante.

## Rollback

Révoquer le commit ramène `rbac/fastapi` à `unsupported` et rouvre l'écart de
parité API. L'aliasing des imports Python et les deux gates de golden sont
indépendants de la capability et doivent rester.
