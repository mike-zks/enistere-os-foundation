# Prochaine action

## Mission achevée

Le Capability Manifest v2 et son graphe déterministe sont exécutables
([ADR-067](../adr/ADR-067-capability-manifest-v2-and-deterministic-graph.md)).

Preuves :

- schéma fermé et versionné unique ;
- registre local découvert depuis `capabilities/*`, sans liste de dépendances
  codée dans le moteur ;
- `requires` résolu par closure transitive, tri topologique stable et refus des
  cycles ;
- `requested`, `autoIncluded`, `order` et `edges` portés jusqu’au plan et au
  lock ;
- conflits obligatoirement symétriques, expliqués et bloquants ;
- targets `ready` liées à un adapter/version réel ;
- contrats, primitives provider-neutral, modes de déploiement, migrations et
  suites de conformité résolus par application ;
- résolution testée sur deux autorités backend Spring et NestJS, sans
  revendiquer leur génération avec capability ;
- artefact généré `packages/contracts/capabilities.json` ;
- CLI `capability list` et `capability describe` ;
- manifests Auth/RBAC/Files migrés sans modifier la matrice produit ;
- overlays Spring alignés sur la version `0.2.0` ;
- aucun bundle, aucun pipeline parallèle, aucune capability nouvelle ;
- aucune source `starters/*/base/`, aucune `composition.baseSource`.

## Limites honnêtes

- le lifecycle add/remove/upgrade/migrate in-place n’est pas livré ;
- les providers d’infrastructure ne sont pas sélectionnés ;
- la conformité produit entre adapters n’est pas encore mesurée par une suite
  commune ;
- `distributed-platform` avec capabilities reste bloqué ;
- aucun statut `PRODUCT_EQUIVALENT` ou `PRODUCTION_READY` n’est revendiqué.

## Prochaine mission unique

> **Rendre Authentication conforme au contrat Capability v2 sur ses targets
> actuellement `ready`, avec une suite produit commune, sans ajouter de target
> ni de nouvelle capability.**

### Justification de l’ordre

Le framework sait désormais décrire et résoudre une capability, mais les
preuves Auth restent distribuées entre overlays et goldens. Avant User
Management, Events ou toute nouvelle capability, il faut démontrer que le même
contrat produit Authentication est satisfait sur NestJS, Spring, Next.js et
React Native selon le rôle de chaque target.

### Critères de sortie

- cas d’usage et erreurs Authentication versionnés dans une source neutre ;
- matrice autorité API / client officiel explicite ;
- suite de conformité commune branchée sur les preuves existantes ;
- NestJS et Spring évalués contre les mêmes invariants serveur ;
- Next.js et React Native évalués contre les mêmes invariants client
  applicables ;
- audit métier Authentication déclaré sans dupliquer l’infrastructure d’audit ;
- statuts `CONFORMANT` uniquement là où les preuves passent ;
- Angular, Flutter et FastAPI inchangés et honnêtement non `ready` ;
- aucun nouveau runtime, provider ou capability ;
- aucun dossier `base/`.
