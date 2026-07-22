# Architecture d’exploitation et de déploiement

## Environnements

- local ;
- test ;
- integration ;
- staging ;
- production.

## Packs initiaux

- Docker Compose local ;
- Docker Compose staging ;
- production conteneurisée sur VM ;
- CI de référence ;
- publication registry.

Kubernetes reste optionnel et ultérieur.

## Exigences

- configuration externe ;
- secrets externalisés ;
- health checks ;
- logs structurés ;
- métriques ;
- tracing ;
- sauvegarde ;
- restauration ;
- migrations contrôlées ;
- rollback ;
- alerting ;
- runbooks.

## Scalabilité

Chaque application et primitive déclare :

- stratégie stateless ;
- pools de connexions ;
- cache ;
- queue ;
- capacité de stockage ;
- croissance des données ;
- background processing.

## Résilience

- timeouts ;
- retries bornés ;
- idempotence ;
- dead-letter queue ;
- graceful shutdown ;
- circuit breaker lorsque justifié ;
- graceful degradation.

## Déploiement

- rolling ;
- recreate ;
- blue/green futur ;
- canary futur.
