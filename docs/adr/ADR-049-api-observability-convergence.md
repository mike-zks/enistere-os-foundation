# ADR-049 — Convergence observabilité de la famille API (logs structurés)

- Statut : Validé
- Date : 2026-07-23
- Décideur : Owner Foundation

## Contexte

Après [ADR-048](ADR-048-canonical-api-error-contract.md), la paire API NestJS↔Spring est en parité sur
l'erreur, la corrélation et la santé. Le dernier invariant `MISSING` du Platform Contract API mesuré est
l'**observabilité (logs, metrics, tracing)**.

Audit direct (Phase A) de la référence NestJS (implémentée, Pino, [ADR-040](ADR-040-structured-logging-strategy.md)) :

- **logs JSON structurés sur stdout** (schéma : `timestamp, level, message, context, service, environment,
  requestId, method, route normalisée, statusCode, durationMs, userId?, errorCode?`) ;
- **corrélation** par `requestId` (`X-Request-Id`) + **un seul log de fin de requête** ; sondes `/health/*`
  non loguées en succès ; redaction centralisée ;
- **aucun endpoint de metrics** côté NestJS ; **pas de tracing**.

Spring n'a **aucune configuration de logging** (logback par défaut). L'observable canonique de la famille est
donc, aujourd'hui, **les logs structurés corrélés** — pas les metrics ni le tracing (que NI l'un NI l'autre
n'expose).

## Décision

Converger l'observabilité **minimale** de la famille API sur les **logs structurés corrélés**, à parité avec
NestJS :

1. **Spring — logs JSON structurés** : activer le *structured logging* natif de Spring Boot 4.1
   (`logging.structured.format.console`) sur stdout. Le `requestId` (MDC, posé par le `CorrelationIdFilter`
   d'ADR-047) est porté par chaque ligne.
2. **Spring — log de fin de requête** : un filtre (`RequestLoggingFilter`) émet **un seul** log par requête à
   sa fin (`method`, `route` normalisée, `statusCode`, `durationMs`), niveau `5xx→error`/`429→warn`/`info`,
   sondes `/health/*` en succès non loguées — miroir du log HTTP NestJS.
3. **Évaluateur de conformité** : nouvel invariant `observability` (logs structurés + log de requête),
   `compliant` sur NestJS **et** Spring.

**Metrics et tracing restent différés** (réservés ADR-018 / ADR-036, côté Deployment) : les exiger casserait
la parité tant que NestJS ne les expose pas.

## Conséquences positives

- parité observable de la famille API sur les logs structurés corrélés ; dernier invariant API commun couvert ;
- base saine pour la collecte (Deployment : `stdout JSON → agent → Loki/Grafana`, ADR-040) sans transport
  embarqué ;
- Platform Contract API minimal désormais **complet** (config, erreur, corrélation, santé, OpenAPI, migrations,
  sécurité de base, observabilité) → prochaine étape : extension aux familles Web et Mobile.

## Coûts et risques

- Le format de logs Spring (ECS natif) n'est pas identique champ-à-champ au schéma NestJS (Pino) : la parité
  est **comportementale** (JSON structuré corrélé), pas byte-à-byte — assumé.
- **Redaction complète** (sensitive-fields) et **schéma de log V1** exhaustif côté Spring restent différés : le
  log de requête minimal n'émet aucun champ sensible par construction.

## Périmètre

Inclus : Spring base (structured logging + `RequestLoggingFilter`) ; invariant `observability` de l'évaluateur.

Exclus : metrics/prometheus, tracing/OpenTelemetry, redaction centralisée Spring exhaustive, schéma de log V1
complet, familles Web/Mobile, NestJS (déjà conforme).

## Alternatives rejetées

- **Logs + metrics (Actuator/Prometheus)** : asymétrie avec NestJS (sans metrics) → rompt la parité, crée une
  dette NestJS.
- **Parité complète des logs** (redaction, serializers, schéma V1 Java) : dépasse le « minimal ».

## Migration

Additif. Le format de logs console Spring devient du JSON structuré (ECS) au lieu du texte logback —
changement de sortie de logs (attendu), pas de rupture d'API.

## Tests

Spring généré `mvnw verify` vert ; goldens `spring-*` verts ; l'évaluateur assère `observability` = `compliant`
sur NestJS et Spring.

## Rollback

`git revert` de la convergence Spring : l'évaluateur re-signale Spring `observability` non conforme.

## Suite

Missions séparées : redaction/schéma de log V1 Spring ; metrics + tracing (ADR-018/036, Deployment) ; extension
du Platform Contract exécutable aux familles Web et Mobile.
