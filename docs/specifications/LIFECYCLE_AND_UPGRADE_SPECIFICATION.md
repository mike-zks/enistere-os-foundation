# Lifecycle and Upgrade Specification

## Opérations

- inspect ;
- diff ;
- add/remove application ;
- add/remove capability ;
- upgrade runtime ;
- upgrade capability ;
- migrate blueprint ;
- reconcile ;
- rollback.

## Zones de propriété

- Factory-owned ;
- user-owned ;
- shared-managed ;
- generated-contract ;
- generated-migration.

La Factory ne peut écraser un fichier user-owned.

## Diff

Le diff compare :

- blueprint désiré ;
- lock ;
- état du workspace ;
- versions disponibles ;
- migrations nécessaires.

## Upgrade

Tout upgrade produit :

- plan ;
- risques ;
- fichiers ;
- migrations ;
- tests ;
- rollback.

## Divergence

Une modification manuelle n’est jamais supprimée silencieusement.

## Compatibilité

SemVer, dépréciation explicite et fenêtres de support.
