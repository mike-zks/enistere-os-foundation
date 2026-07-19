# Files — payload NestJS parqué (non câblé)

Code Files (upload multipart, stockage objet S3/MinIO, cycle de vie,
quarantaine, réconciliation, quotas, scripts d'exploitation, e2e, specs de
composition complète) extrait du starter NestJS lors de la mission Capability
Packs 1A (extraction Auth). Ce payload n'est **pas** un overlay actif : il n'y a
pas d'`overlay.json`, la capability reste `planned` sur toutes les targets et
`enistere generate` refuse toujours `files`.

Une mission dédiée transformera ce payload en overlay déclaratif : fragment
Prisma (`StoredFile` + relation propriétaire), migrations SQL dédiées,
dépendances (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`,
`@types/multer`), variables `FILE_*`/`S3_*`/`FILES_*` et intégrations
(`nestjs.module`, throttlers `upload`/`download`).
