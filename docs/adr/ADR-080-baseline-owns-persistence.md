# ADR-080 — Le Platform Baseline FastAPI porte la persistance

- Statut : Validé et implémenté
- Date : 2026-08-01
- Décideur : Owner Foundation
- Complète : ADR-077 et ADR-079
- Révise : la position « aucun provider de données dans le baseline » du starter FastAPI

## Contexte

ADR-079 a refermé toutes les dettes de placement sauf une, et ce dernier cas
n'en était pas une : `app/persistence` — moteur SQLAlchemy, session, transaction,
puits d'audit — est livré par Authentication et utilisé par Authentication **et**
RBAC.

Ce n'est ni du métier (il ne nomme aucun domaine) ni la possession d'une
capability (il est partagé). C'était la seule zone du dépôt que FF5d ne mesurait
pas, et la règle ne savait pas exprimer *« une capability contribue légitimement
de l'infrastructure de cœur »*.

## Ce que les faits disaient

| Runtime | Persistance dans le baseline |
|---|---|
| NestJS | Prisma — client, schéma, migrations, seed |
| Spring | JPA, Flyway, pilote PostgreSQL |
| FastAPI | des `Protocol` seulement |

Le starter FastAPI écrit sa position en toutes lettres, deux fois : *« aucun ORM
ni provider de base de données n'est imposé par le baseline »* et *« une primitive
persistence fournit l'adapter `MigrationPort`, ses migrations versionnées et sa
transaction »*.

**Cette primitive n'existe pas.** La Factory modélise les primitives comme des
*besoins* déclarés par une capability (`auth-store`, `requirement: required`),
jamais comme des fournisseurs. Le starter décrivait un mécanisme que le moteur
n'a pas.

## Décision

**Le baseline FastAPI porte l'adaptateur de persistance**, comme ses deux pairs
de famille. C'est la troisième fois dans ce chantier que la parité de famille
tranche une question que l'analyse abstraite laissait ouverte — après le
placement des capabilities, puis le port de stockage de Spring.

### Ce qui bouge

* `app/persistence/` — moteur, session, transaction, puits d'audit et son
  modèle — passe de l'overlay Authentication au starter ;
* l'outillage Alembic (`alembic.ini`, `migrations/env.py`, `script.py.mako`)
  aussi : c'est le *runner* de migrations, pas une migration ;
* la table `audit_logs` devient une **révision du baseline** (`0001_baseline`),
  exactement comme le `V0__init_base.sql` de Spring et le schéma Prisma de
  NestJS. Les capabilities se rebasent : `0002_auth`, `0003_rbac` ;
* les dépendances SQLAlchemy, asyncpg et Alembic passent aux locks du starter.

### Ce qui ne bouge pas

**L'activation reste composée.** Le baseline possède le code ; le hook
`persistence_lifespan` n'est branché que par la couture `fastapi.lifespan`, donc
une application de base **n'ouvre jamais de pool**. C'est ce qui distingue cette
décision d'un simple ajout de dépendance : le socle rend un adaptateur
disponible, il ne l'impose pas.

`ENISTERE_DATABASE_URL` reste déclarée par la capability : c'est elle qui rend la
base nécessaire, même si l'adaptateur ne lui appartient plus.

## Le coût, énoncé

**`fastapi-base` installe désormais SQLAlchemy, asyncpg et Alembic sans les
utiliser.** Le lock de développement passe de 48 à 54 lignes, celui de production
de 16 à 22. C'est un vrai coût, et il faut le dire plutôt que le présenter comme
gratuit.

Il est accepté pour trois raisons : NestJS et Spring le paient déjà ; il rend la
famille API homogène ; et il supprime le seul angle mort de mesure du dépôt.

## Conséquences

### Acquis

* **FF5d mesure les sept runtimes sans angle mort**, et rapporte zéro violation.
  `layout-gaps.json` est vide.
* RBAC ne dépend plus d'Authentication pour son infrastructure — seulement pour
  ce qu'il déclare : `requires: ["auth"]`.
* Une régénération peut remplacer l'intégralité du socle FastAPI, persistance
  comprise, sans toucher à ce qu'une capability a livré. C'était le but.

### Assumé

* Le coût de dépendances ci-dessus.
* La position écrite du starter FastAPI est **révisée**, pas contournée : le
  README et le README des migrations sont corrigés. Une décision qu'on
  contredit sans réécrire est une décision qu'on trahit.

### Non revendiqué

* **La primitive fournisseuse n'existe toujours pas.** Cette ADR choisit le
  baseline *faute* de ce mécanisme, pas contre lui. Si la Factory acquiert un
  jour des primitives fournisseuses, la persistance en serait la première
  candidate et cette décision devrait être rouverte.
* `migrations/env.py` **énumère en dur** les modules de modèles pour
  l'autogénération. Le défaut est antérieur et reste ouvert ; il est désormais
  documenté dans le fichier lui-même, avec le correctif propre — une couture de
  composition.
* La régénération elle-même n'existe pas. Cette ADR en lève le dernier obstacle
  structurel connu, elle ne la livre pas.

## Alternatives écartées

* **Authentication possède la persistance, RBAC en dépend.** Le statu quo rendu
  explicite. Rejeté : une capability devient fournisseur d'infrastructure pour
  d'autres, ce qu'aucun des deux pairs de famille ne fait.
* **Construire la primitive fournisseuse.** La bonne réponse à terme, et un
  chantier de moteur bien plus vaste que le problème posé. Reporté, pas nié.
* **Laisser l'angle mort.** Une règle qui ne mesure pas une zone finit par
  laisser passer ce qui s'y accumule.

## Tests

```bash
npm run factory:test                      # 500
node factory/quality/scripts/golden-runtime.mjs fastapi-base
node factory/quality/scripts/golden-runtime.mjs fastapi-rbac
```

* **`fastapi-base`** — `ruff` propre, **12/12 pytest**, `compileall` vert, et
  l'application **démarre sans base de données** : `/health/ready` répond 200,
  aucun hook de persistance composé ;
* **`fastapi-rbac`** — `ruff` propre, **40/40 pytest** sur PostgreSQL réel, les
  trois révisions enchaînées `0001_baseline → 0002_auth → 0003_rbac` ;
* FF5d : **zéro violation sur les sept runtimes**, sans zone exclue de la mesure.

## Rollback

Révoquer le commit rend `app/persistence` à l'overlay Authentication, refusionne
la table d'audit dans sa migration et rouvre l'angle mort de FF5d.
