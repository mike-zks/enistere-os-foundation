# Logging structuré — V1 (ADR-040)

Logging technique **structuré JSON** du starter NestJS V1. Décision : **ADR-040** (Pino moteur
officiel). Après preuve de compatibilité (`docs/STRUCTURED_LOGGING_COMPATIBILITY_PROOF.md`), la
solution retenue est **Pino direct** (le repli officiel) — `nestjs-pino` étant compatible NestJS 11
mais structurellement inadapté (auto-log d'URL brute, request id propre, destination globale).

## Principes

- **Moteur** : Pino (`AppLogger`, `LoggerService` NestJS) ; aucune dépendance `nestjs-pino`.
- **Destination** : JSON par ligne sur **stdout** (HTTP) / **stderr** (CLI, drapeau interne
  `LOG_STDERR`). **Aucun transport distant** ; **collecte = Deployment**.
- **AuditLog ≠ logs techniques** : l'audit (sécurité/métier, persistant) reste séparé. Un événement
  critique peut produire un audit **et** un log technique minimal, sans duplication ni secret.

## Schéma de log

`timestamp` (ISO-8601), `level`, `message`, `context`, `service`, `environment`, puis selon le
contexte : `requestId`, `method`, `route` (**normalisée**, ex. `/files/:id`), `statusCode`,
`durationMs`, `userId`/`sessionId` (UUID), `operation`, `errorCode`, `errorType`. Réservés futurs :
`traceId`/`spanId` (OpenTelemetry, non implémenté).

## Configuration

`SERVICE_NAME` (défaut `api-nestjs-core`), `LOG_LEVEL` (`fatal|error|warn|info|debug|trace|silent`),
`LOG_PRETTY` (dev uniquement ; **forcé `false` en production**), `LOG_HTTP_ENABLED`,
`LOG_HEALTH_SUCCESS_ENABLED`. Niveaux : production `info`, staging `debug`/`info`, dev `debug`,
test `silent`. Validés au démarrage (`env.validation`).

## Request ID & contexte

Réutilise le middleware **`X-Request-Id`** existant (un seul id ; format validé ou UUID généré ;
**pas une donnée de sécurité**). `RequestContextMiddleware` établit un `AsyncLocalStorage` par
requête : les logs applicatifs portent automatiquement `requestId` (mixin). Après authentification,
`RequestUserContextInterceptor` ajoute `userId`/`sessionId` (UUID) au contexte. Hors HTTP (CLI/jobs)
: `operationId`.

## Logs HTTP

**Un seul** log de fin de requête (`res 'finish'`) : `requestId`, `method`, `route` normalisée,
`statusCode`, `durationMs` (+ `userId`/`sessionId` si authentifié). Niveaux : `5xx → error`,
`429 → warn`, `2xx/3xx/4xx → info`. Succès des sondes `/health/*` **non logués** par défaut.
Jamais : `Authorization`, `Cookie`, body, query, URL signée, multipart, buffer.

## Redaction (centralisée)

`sensitive-fields.ts` masque par **clé** (à toute profondeur) : `authorization`, `cookie`,
`password`, `*token*`, `*secret*`, `*key*`, `DATABASE_URL`, `S3_*`, `JWT_*_SECRET`, `storagekey`,
`checksum`, etc. `url`/`*url` masqué **uniquement** si la valeur est une URL **signée**
(`X-Amz-Signature`…). `scrubString` nettoie les textes libres (chaînes de connexion, params signés,
bearer). Le sérialiseur d'erreur **liste blanche** (`errorType`/`errorCode`/`message`/`stack`/`cause`)
n'expose jamais l'objet externe complet (AWS/Prisma). Marqueur stable : `[Redacted]`.

## Erreurs

5xx → `error` (détail technique : type/code/stack sérialisés + `requestId`) via `AllExceptionsFilter`
(qui ne re-logue pas les 4xx — le log HTTP suffit) ; la réponse publique reste l'enveloppe générique
inchangée. `stack` **uniquement** en logs techniques, jamais dans la réponse.

## CLI

`résultat machine → stdout`, `logs techniques → stderr` (les scripts posent `LOG_STDERR=1` et
`app.useLogger(AppLogger)`). Le JSON machine n'est jamais corrompu ; exit codes préservés.

## À FAIRE / À NE PAS FAIRE (agents IA)

- ✅ Utiliser `AppLogger` avec des **champs structurés** + `context` stable :
  `logger.info({ operation: 'files.reconciliation', scanned: 100 }, 'File reconciliation completed')`.
- ❌ Jamais `console.log` applicatif (sauf résultat machine CLI documenté).
- ❌ Jamais logger un objet `request` complet, un DTO sensible, une erreur externe brute.
- ❌ Jamais de token, mot de passe, buffer, URL signée, `storageKey`, `bucket`, `checksum`.
- ✅ Ajouter des **tests de redaction** ; respecter la **séparation Audit/Logs**.

## Préparation Loki / OpenTelemetry

Loki (Deployment) : labels **peu nombreux** (`service`, `environment`, `level`) ; `requestId`/
`userId`/`fileId`/route restent dans le **corps** JSON (cardinalité maîtrisée). OpenTelemetry : champs
`traceId`/`spanId` réservés ; non implémenté en V1.
