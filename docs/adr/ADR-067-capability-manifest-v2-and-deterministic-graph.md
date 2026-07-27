# ADR-067 — Capability Manifest v2 et graphe déterministe

- Statut : Validé et implémenté
- Date : 2026-07-27
- Décideur : Owner Foundation
- Complète : ADR-055, ADR-057 et ADR-066

## Contexte

Les trois capabilities livrées (`auth`, `rbac`, `files`) possédaient déjà des
manifests portant `schemaVersion: "2"`, mais ce contrat ne couvrait pas toute la
cible :

- l’enforcement de `requires` restait codé en dur dans le moteur ;
- l’ordre d’application dépendait de `CAPABILITY_IDS` ;
- `conflicts` était validable mais ni symétrique, ni expliqué, ni résolu ;
- adapters, primitives, modes de déploiement et preuves de conformité
  n’étaient pas résolus par application ;
- migrations et preuves existaient dans les overlays sans appartenir au
  contrat de capability ;
- les appels avec une sélection incomplète étaient refusés au lieu de produire
  l’auto-closure tracée décidée par ADR-055.

Cette double source empêchait le framework de grandir sans modifier le moteur.

## Décision

### 1. Manifeste fermé et complet

`factory/schema/capability.schema.json` est la forme normative unique. Chaque
manifest v2 déclare obligatoirement :

```text
identity/version
requires
conflicts { id, reason }
responsibilities
contracts
primitives sémantiques
configuration typée
targets
migrations
conformance
```

Une target `ready` déclare en plus :

```text
mode
adapter { id, version }
contracts[]
primitives[]
deploymentModes[]
migrations[]
conformance[]
```

Une target non `ready` ne peut porter aucun de ces engagements.

### 2. Primitives sans provider fictif

Une capability exprime un besoin sémantique (`relational-database`,
`object-storage`, etc.), sa nécessité et ses usages. Elle ne choisit pas
PostgreSQL, MinIO ou Alfresco. Ce choix appartient au Blueprint et à la
résolution d’infrastructure future.

`Files` distingue donc :

- `files-object-store` de kind `object-storage` ;
- `files-metadata-store` de kind `relational-database`.

Un `content-repository` resterait un autre besoin ; il n’est pas substitué
implicitement à l’object storage.

### 3. Graphe à source unique

Le registre local est découvert depuis `capabilities/*/capability.json`, trié
lexicalement. `requires` est l’unique source des arêtes.

La résolution :

1. trie les demandes ;
2. calcule la closure transitive ;
3. refuse les cycles ;
4. produit un ordre topologique stable, dépendances avant dépendants ;
5. expose `requested`, `autoIncluded`, `order` et `edges` ;
6. applique les overlays dans cet ordre exact.

Exemple :

```text
request: files
order: auth → rbac → files
autoIncluded: auth, rbac
```

Il n’existe ni bundle implicite, ni second ordre dans le générateur.

### 4. Conflits symétriques et expliqués

Chaque conflit porte une raison non vide. Le manifest opposé doit déclarer le
même conflit avec la même raison. Une paire présente dans la closure bloque la
résolution avec un diagnostic structuré.

Le catalogue courant ne déclare aucun conflit. Le mécanisme est néanmoins
exécutable et testé sans créer de capability factice dans le dépôt.

### 5. Résolution par application

Le resolver projette chaque capability sur chaque application ciblée et inscrit
dans `ResolvedSystem` puis `GenerationPlan` :

- status et mode ;
- adapter/version ;
- contrats ;
- primitives ;
- modes de déploiement ;
- migrations ;
- suites de conformité ;
- origine `requested` ou `dependency`.

Cette résolution fonctionne aussi avec plusieurs autorités backend. Cela ne
promet pas leur génération : le slice `distributed-platform` avec capabilities
reste bloqué tant qu’un golden produit ne l’a pas prouvé.

### 6. Preuves et matérialisation

Le projet généré publie
`packages/contracts/capabilities.json`. Le plan et `enistere.lock` portent le
graphe et les résolutions par application.

Les payloads de migration référencés doivent exister. Une target `ready` en
mode `overlay` doit posséder un overlay de même identité et de même version que
le manifest.

## Migration des actifs

`auth`, `rbac` et `files` ont été migrées au contrat complet sans changer leur
surface produit ni leur matrice de support. Les overlays Spring ont été alignés
sur la version `0.2.0` des manifests.

Aucune capability et aucun runtime n’ont été ajoutés.

## Invariants conservés

- Platform Baseline implicite, jamais capability ;
- Observability et Technical Audit restent obligatoires dans les runtimes ;
- pipeline canonique unique ;
- overlays déclaratifs sans commande libre ;
- une seule source à `starters/<runtime>` ;
- aucun dossier `starters/*/base/` et aucune `composition.baseSource`.

## Statut réel

`IMPLEMENTED` :

- schema et validateur ;
- découverte locale ;
- closure, cycles, conflits ;
- résolution adapters/contrats/primitives/migrations/conformance ;
- plan, lock et artefact généré ;
- CLI `capability list|describe`.

Non revendiqué :

- installation/suppression/upgrade in-place ;
- sélection de providers d’infrastructure ;
- conformité produit équivalente entre adapters ;
- génération du profil distribué avec capabilities ;
- nouvelle capability.

## Preuves

- `factory/test/capabilities.test.mjs` ;
- `factory/test/canonical-pipeline.test.mjs` ;
- `factory/test/rbac-composition.test.mjs` ;
- `factory/quality/scripts/fitness-functions.test.mjs` ;
- goldens existants Auth/RBAC/Files, sans nouveau pipeline.

## Prochaine action unique

> Rendre Authentication conforme au contrat Capability v2 sur ses targets
> actuellement `ready`, avec une suite produit commune, sans ajouter de target
> ni de nouvelle capability.
