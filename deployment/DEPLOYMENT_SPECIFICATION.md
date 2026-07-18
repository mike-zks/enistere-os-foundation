# Deployment Specification

## Objectif

Fournir aux projets dérivés des profils d'exécution local et staging reproductibles, sécurisés et
adaptables aux deux APIs et deux surfaces web.

## Baseline

- PostgreSQL, Redis et MinIO sur réseau interne ;
- reverse proxy HTTPS pour staging ;
- images immuables produites par CI ;
- migrations exécutées depuis l'image applicative ;
- secrets injectés hors Git ;
- health checks, backup/restore et rollback documentés.

## Sécurité

Aucun secret par défaut, aucune base exposée publiquement, TLS obligatoire en staging, fichiers privés,
URLs signées courtes et journaux sans données sensibles.

## Limites

La Foundation fournit des packs et runbooks, pas une infrastructure universelle. Kubernetes, cloud
provider, observabilité distribuée et production multi-région nécessitent une décision de projet.

## Validation

Compose parsable, images construites et démarrées, health checks, migrations, E2E, backup/restore et
rollback. Les preuves serveur sont des gates de release, pas des tests de chaque PR.
