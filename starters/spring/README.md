# Starter API Spring Boot

Socle API Spring Boot 4.1 / Java 21 conforme au contrat cible
`Platform Baseline 2.0.0` et au contrat de famille `api/2.0.0`.

Le starter constitue une base de production minimale. Authentication, Authorization,
Files et Events ne sont pas activés implicitement : leurs capabilities se branchent sur
des ports versionnés.

## Exécution

```bash
./mvnw test
./mvnw verify
./mvnw spring-boot:run
```

Une instance PostgreSQL est nécessaire au démarrage normal :

```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/enistere
export SPRING_DATASOURCE_USERNAME=enistere
export SPRING_DATASOURCE_PASSWORD=<secret>
export CORS_ALLOWED_ORIGINS=https://customer.example,https://admin.example
```

## Platform Baseline

- configuration externalisée par `application.yml` et `@ConfigurationProperties` ;
- enveloppe d’erreur canonique avec `requestId` ;
- logs ECS structurés, sans payload ni secrets ;
- corrélation `X-Request-Id` et propagation W3C `traceparent` ;
- métriques Micrometer bornées et hook `telemetry/2.0.0` pour OpenTelemetry ;
- audit technique best-effort séparé des logs ;
- CORS explicite, en-têtes de sécurité et rate limiter de base ;
- `/health`, `/health/live`, `/health/ready` et Actuator ;
- lifecycle `STARTING → READY → DRAINING → STOPPED` ;
- arrêt gracieux avec délai borné ;
- tests unitaires et comportementaux Maven.

## Points d’extension API

Le package `platform.extensions` expose le contrat `api-extension/2.0.0` :

- `AuthenticationHook` ;
- `AuthorizationHook` ;
- `FileHook` ;
- `EventHook`.

`RuntimeExtensionRegistry` refuse les versions incompatibles et plusieurs providers
actifs pour le même point. L’absence d’une capability ne crée donc aucun comportement
métier implicite.

## Observabilité

`RequestTelemetryFilter` continue ou crée un contexte W3C, ajoute le `traceId` au MDC et
enregistre les mesures dans `MicrometerTelemetryAdapter`. Les métriques n’utilisent que
des labels bornés (`method`, route normalisée et classe de statut). Le `traceId` n’est
jamais utilisé comme label.

`OpenTelemetryHook` constitue le point d’intégration du SDK/exporter. Le backend de
télémétrie appartient au déploiement et n’est pas embarqué dans le starter.

## Arrêt

Spring reçoit `server.shutdown: graceful` et
`spring.lifecycle.timeout-per-shutdown-phase: 20s`. `RuntimeLifecycle` coordonne les
hooks additionnels en ordre inverse d’inscription et garantit leur exécution unique.

## Limites prouvées

La conformité structurelle reste `GENERATABLE`. Les ports neutres de persistence et de
transaction, les diagnostics avancés, la configuration typée complète et les quality
gates Java renforcés restent partiels. Aucun statut `BOOTABLE`, `CONFORMANT` ou
`PRODUCTION_READY` n’est déduit de ce README.

Voir également [STARTER_SPECIFICATION.md](./STARTER_SPECIFICATION.md) et le rapport
calculé `factory/conformance/reports/platform-baseline-v2-gap.json`.
