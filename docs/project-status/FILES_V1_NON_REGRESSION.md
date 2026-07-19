# Files V1 — non-régression de composition

## Périmètre

Capability Packs 1C extrait la verticale Files historique dans un overlay déclaratif. La sélection
est valide seulement avec `base + auth + rbac`, et seulement sur NestJS, Next.js et React Native.
Spring, Angular et Flutter restent planifiés pour Capability Packs 2.

## Garanties conservées

- NestJS conserve upload multipart, validation MIME/taille, stockage S3/MinIO, métadonnées publiques,
  URL de téléchargement signée, suppression, quarantaine, restauration, quotas et réconciliation.
- Les champs internes (`storageKey`, bucket, propriétaire et credentials) ne sont pas exposés par les
  DTO publics ni les logs.
- Next.js conserve les contrôles BFF de méthode, CSRF/Origin, cookies same-origin, erreurs bornées,
  mutations anti-double-submit et invalidation du cache Files.
- React Native ne reçoit qu'une surface d'upload/navigation ; l'autorité API, les tokens et les
  données serveur restent hors du store local.

## Preuves

Les tests Factory vérifient les overlays, les dépendances, l'absence de Files dans `base + auth`,
la composition des registres, l'absence de snapshots OpenAPI et la génération des trois compositions
Files. Les goldens `nestjs-files`, `nest-next-files` et `triple-files` exécutent l'installation,
la génération OpenAPI composée, les gates de chaque application et l'audit borné par target.

## Limites acceptées

La preuve runtime complète dépend encore des services jetables PostgreSQL/MinIO en CI. Les overlays
Spring, Angular et Flutter, l'offline sync, la restauration métier avancée et la publication externe
restent hors de Files V1.
