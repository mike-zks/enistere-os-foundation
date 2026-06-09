# UploadModule — cadrage V1

Ce dossier est réservé à la future implémentation upload MinIO/S3.

Décisions applicables :

- ADR-007 : MinIO/S3 compatible, API comme autorité d'upload, validation, metadata, permissions et URLs signées.
- ADR-011 : les clients React Native utilisent `fetch + FormData` pour multipart.
- ADR-006 : les accès fichiers doivent respecter RBAC + permissions fines.

Cette mission ne crée aucun service upload, bucket, client MinIO/S3, modèle fichier ou endpoint.

La mission dédiée devra :

- valider taille, MIME type et extension côté backend ;
- générer les `storageKey` côté serveur ;
- garder les buckets privés par défaut ;
- ne jamais logger de secrets ou URLs sensibles longues durées ;
- prévoir audit logs sur actions sensibles.
