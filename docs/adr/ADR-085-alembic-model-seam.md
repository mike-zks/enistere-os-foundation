# ADR-085 — Les modules de modèles Alembic passent par une couture

- Statut : Validé et implémenté
- Date : 2026-08-01
- Décideur : Owner Foundation
- Corrige : une affirmation répétée par ADR-079, ADR-080 et ADR-084

## Contexte

`migrations/env.py` énumérait en dur les modules de modèles à importer :

```python
for module in ("app.modules.auth.models", "app.modules.authorization.models"):
```

Le défaut est cité dans trois ADR successives, chaque fois avec la même
description — *« un `--autogenerate` proposerait de supprimer les tables RBAC »*.
**Cette description était fausse**, et il a suffi de lancer Alembic pour le voir.

## Ce que la mesure a montré

Contre un PostgreSQL réel, sur `fastapi-rbac` migré :

| situation | ce qu'`--autogenerate` propose |
|---|---|
| tel que livré | **rien** |
| une capability tierce, non énumérée | **rien** non plus |
| un module énuméré retiré | `op.drop_table('users')`, `('roles')`, `('permissions')`, `('refresh_tokens')`, `('user_roles')`, `('role_permissions')` |

Deux corrections à ce que les ADR affirmaient :

**Le défaut était latent, pas actif.** L'énumération nommait exactement les deux
seules capabilities FastAPI existantes ; elle était donc juste. Rien ne se
serait produit tant qu'aucune troisième n'aurait livré de modèles — et Files sur
FastAPI est au programme.

**Et le mode de panne n'était pas celui décrit.** Une capability non énumérée
n'est pas *vue comme à supprimer* : elle est **invisible**. Son module n'étant
jamais importé, ses tables ne sont pas dans `Base.metadata`, et si sa migration
ne les a pas encore créées, Alembic ne voit aucune différence — donc ne crée
rien non plus. Les suppressions n'arrivent qu'une fois les tables réellement en
base : c'est alors la troisième ligne du tableau, et elle emporte aussi les
tables d'Authentication.

Autrement dit : le danger est réel, il arrive plus tard qu'annoncé, et il frappe
plus large.

## Décision

**Une couture de composition, comme pour les routeurs et les lifespans.**

* nouvelle intégration `fastapi.model-module` (`importPath` seul) ;
* nouvelle destination générée `app/composition/capability_models.py` ;
* `env.py` importe la couture au lieu d'énumérer.

L'import *est* l'enregistrement : importer le module inscrit ses tables sur
`Base.metadata`, et c'est cet enregistrement qu'`--autogenerate` compare à la
base. La couture étant générée à partir des intégrations déclarées, elle ne peut
pas prendre de retard sur la composition — ce qu'une liste écrite à la main
faisait par construction.

## Conséquences

### Acquis

* Sur un projet composé, `--autogenerate` propose **zéro opération** — vérifié
  en exécutant Alembic, pas en relisant `env.py`.
* Une capability tierce déclarée par la couture est vue : `--autogenerate`
  propose `op.create_table('invoices')` pour un modèle que l'énumération
  n'aurait jamais pu connaître.
* Le dernier défaut nommé et jamais traité de la famille API est refermé.
* **FF5f — `capability-model-seam`** : une capability FastAPI qui livre un
  `models.py` doit déclarer son `fastapi.model-module`. La réserve que cette
  ADR allait énoncer — *rien ne force un overlay à le faire* — est vérifiable
  par machine, donc elle appartient à une gate et non à un paragraphe. Éprouvée
  dans les deux sens.

### Assumé

* La règle lit `capabilities/<id>/targets/fastapi/files/app/modules/*/models.py`.
  Un modèle rangé ailleurs, ou nommé autrement, lui échappe.

### Non revendiqué

* **`--autogenerate` n'est toujours pas un outil de production ici.** Les
  révisions sont écrites à la main, et cette ADR ne change pas cela : elle rend
  seulement l'outil honnête quand quelqu'un s'en sert.
* Rien n'est fait pour les projets déjà générés : leur `env.py` porte encore
  l'énumération, jusqu'à régénération.

## Alternatives écartées

* **Découvrir les modules par balayage du système de fichiers.** Il faudrait
  décider en Python ce que la Factory sait déjà, et un fichier `models.py` du
  propriétaire deviendrait un modèle composé sans qu'il l'ait demandé.
* **Garder l'énumération en l'allongeant.** C'est ce que trois ADR ont proposé de
  faire un jour ; le défaut n'est pas la longueur de la liste, c'est qu'elle
  soit écrite à la main.

## Tests

```bash
npm run factory:test                      # 518
node factory/quality/scripts/golden-runtime.mjs fastapi-base
node factory/quality/scripts/golden-runtime.mjs fastapi-rbac
node factory/quality/scripts/golden-runtime.mjs fastapi-auth --regenerate-from fastapi-base
```

* **Contre une vraie base** : `fastapi-rbac` migré, puis `alembic revision
  --autogenerate` → aucune opération, aucune suppression ;
* **le cas que l'énumération ne pouvait pas couvrir** : une troisième capability
  déclarée par la couture est détectée (`Detected added table 'invoices'`) ;
* le registre d'adaptateurs déclare la nouvelle intégration et sa destination,
  et les tests de couture l'exigent ;
* le rendu est trié et dédupliqué — un import en double est inoffensif à
  l'exécution mais rend le fichier généré non canonique, et le digest du lock
  est comparé octet par octet ;
* **FF5f mord dans les deux sens** : verte sur le registre réel, rouge sur un
  overlay privé de sa déclaration.

## Rollback

Révoquer le commit rend `env.py` à son énumération et retire l'intégration
`fastapi.model-module` — et rend le défaut à son état latent.
