# ADR-084 — Une migration n'est pas du code

- Statut : Validé et implémenté
- Date : 2026-08-01
- Décideur : Owner Foundation
- Corrige : ADR-083, dont une réserve était juste mais gravement incomplète

## Contexte

ADR-083 a livré la régénération et l'a prouvée sur **une** composition,
`nestjs-base → nestjs-auth`. Elle déclarait, en non-revendiqué :

> Aucune migration de données ni de schéma. Retirer une capability supprime son
> code, pas ses tables ni ses migrations déjà appliquées.

La mission suivante devait mesurer ce que cela produisait réellement sur FastAPI,
où les capabilities apportent des révisions **chaînées** —
`0001_baseline → 0002_auth → 0003_rbac`. La mesure a montré que la phrase
décrivait le mauvais problème.

## Ce que la mesure a montré

Contre une vraie base PostgreSQL, pas par raisonnement :

```
alembic upgrade head        0001_baseline → 0002_auth → 0003_rbac
alembic current             0003_rbac (head)

# le propriétaire retire les deux capabilities, puis régénère

alembic current             ERROR  Can't locate revision identified by '0003_rbac'
alembic upgrade head        ERROR  Can't locate revision identified by '0003_rbac'
```

Le problème n'était pas que les tables restaient. **C'est que la régénération
supprimait aussi les fichiers de migration**, et qu'un projet dont le schéma est
estampillé `0003_rbac` ne peut plus exécuter la moindre commande Alembic dès que
cette révision n'existe plus dans le code. Pas un résidu : un projet qui ne
migre plus du tout, dans aucune direction.

## Décision

**Une régénération ne retire jamais un fichier de migration.**

Une migration n'est pas du code : c'est une **histoire**. Elle dit ce qui a déjà
été fait à des bases de données qui ne sont pas dans ce dépôt. Supprimer le
fichier ne défait pas ce qui a eu lieu — cela prive seulement le projet du moyen
de le savoir.

Le répertoire de migrations de chaque runtime est déclaré par son **adaptateur de
cible**, à côté de son gestionnaire de dépendances et de ses coutures : c'est un
fait de runtime, pas une règle de régénération.

| runtime | répertoire |
|---|---|
| NestJS | `prisma/migrations/` |
| Spring | `src/main/resources/db/migration/` |
| FastAPI | `migrations/versions/` |

Les fichiers concernés sont rapportés dans un compartiment `retained` : la
régénération dit ce qu'elle laisse volontairement derrière elle, comme elle dit
déjà ce qu'elle refuse.

**Ce que cela laisse** : une chaîne intacte et, au pire, des tables qu'aucune
capability n'utilise plus. Désordonné plutôt que cassé — et **revenir sur une
migration est une migration**, que le propriétaire écrit lui-même, comme avec
n'importe quel outil de migration.

La copie de provenance sous `capabilities/`, elle, reste supprimée : c'est une
copie de la source Foundation, pas l'histoire du projet.

## Conséquences

### Acquis

* Retirer une capability d'un projet FastAPI déjà migré laisse `alembic current`
  et `alembic upgrade head` opérationnels — vérifié contre la même base réelle
  qui échouait avant le correctif.
* La règle vaut pour les trois runtimes API, sans qu'aucun ne la connaisse : elle
  est lue dans le registre d'adaptateurs.
* La preuve de régénération couvre les trois familles, API comprise sur un
  runtime non-JS.

### Assumé

* **Des tables orphelines.** Un projet qui retire une capability garde ses
  tables. C'est le choix explicite : désordonné vaut mieux que cassé.
* Un projet qui n'avait *jamais* appliqué ces migrations les garde tout de même
  dans son arbre, et `upgrade head` créera des tables qu'aucun code n'utilise.
  La Factory ne sait pas quelles bases ont été migrées, et ne prétend pas le
  savoir.

### Non revendiqué

* **Aucune migration de retrait n'est générée.** La Factory ne sait pas défaire ;
  elle sait ne pas détruire.
* `migrations/env.py` **énumère toujours en dur** les modules de modèles. Le
  défaut est antérieur, documenté dans le fichier, et toujours ouvert.
* La régénération ne reverrouille toujours pas les dépendances.

## Alternatives écartées

* **Supprimer les migrations, comme tout autre fichier.** L'état d'ADR-083, et
  mesuré cassé.
* **Générer une migration de retrait.** Il faudrait décider du sort des données —
  ce que ni la Factory ni une capability ne peuvent savoir.
* **Refuser le retrait d'une capability sur un runtime à migrations.** Punir
  l'opération pour un effet de bord qu'on sait éviter.

## Tests

```bash
npm run factory:test
node factory/quality/scripts/golden-runtime.mjs fastapi-auth --regenerate-from fastapi-base
node factory/quality/scripts/golden-runtime.mjs nest-next-auth --regenerate-from nestjs-next-base
node factory/quality/scripts/golden-runtime.mjs nestjs-flutter-auth --regenerate-from nestjs-flutter-base
```

* **Contre une vraie base** : retrait d'Authentication et de RBAC sur un schéma
  estampillé `0003_rbac`, puis `alembic current` → `0003_rbac (head)` et
  `alembic upgrade head` sans erreur. Avant le correctif, les deux échouaient.
* Un test unitaire couvre le même invariant sur NestJS/Prisma : la migration est
  `retained`, jamais `remove`, et le code de la capability disparaît quand même.
* Un golden de régénération par famille : **API non-JS** (FastAPI), **Web**
  (Next.js) et **Mobile** (Flutter), chacun soumis aux mêmes gates qu'un projet
  généré directement.

## Rollback

Révoquer le commit retire la propriété `migrations` des adaptateurs et le
compartiment `retained` — et rend aux projets à migrations le défaut mesuré
ci-dessus.
