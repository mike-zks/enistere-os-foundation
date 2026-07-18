# Contrat OpenAPI canonique — starter NestJS V1

> Source de vérité des **API publiques** (ADR-016). Le fichier [`openapi.json`](./openapi.json) est
> le **snapshot canonique versionné**, régénéré depuis le code — **jamais édité à la main**.

## Source de vérité

Le contrat est produit par NestJS + `@nestjs/swagger` à partir des contrôleurs décorés et des **DTO
publics de sortie**. Les clients (Web/Mobile, ADR-016) ne redéfinissent jamais manuellement un
contrat déjà présent ici.

## Génération & vérification

```bash
npm run openapi:generate   # (ré)écrit openapi/openapi.json (déterministe)
npm run openapi:check      # échoue (RC=1) si le snapshot diverge du code (diff strict, sans outil externe)
```

Le document est **déterministe** : `info.version` = version du package, aucun serveur en dur, aucune
URL locale, aucun timestamp dynamique. Deux générations successives produisent zéro diff. Logs
techniques sur **stderr**, résultat machine sur **stdout** (ADR-040).

## operationId

Convention stable **`<domaine>_<actionCamelCase>`**, indépendante des noms de classes/méthodes
internes (via `@ApiOperation({ operationId })`) :

```
health_get  health_live  health_ready
auth_login  auth_refresh  auth_logout  auth_getProfile  auth_getAuthorization
files_upload  files_getMetadata  files_createDownloadUrl  files_delete  files_quarantine  files_restore
```

Tout **renommage d'`operationId`** est considéré comme **breaking** (clients générés).

## Tags

`Health`, `Auth`, `Files` (canoniques). Futurs : `Users`, `Roles`, `Permissions`, `Audit`.

## DTO publics & enveloppes

Réponses typées par des **DTO de sortie explicites** (`*ResponseDto`, `PublicStoredFileDto`,
`UserProfileResponseDto`…). L'enveloppe de succès `{ success, data, timestamp }` est documentée par
le décorateur `@ApiSuccessResponse(Dto)` (data typé). `204 No Content` sans corps
(`@ApiNoBodyResponse`). Les endpoints `void` (quarantaine/restauration) utilisent
`@ApiSuccessNoDataResponse`.

## Erreurs

Schéma commun **`ApiErrorResponseDto`** : `success`, `statusCode`, `message`, `errorCode`,
`details?`, `path`, `timestamp`, `requestId?`. Décorateur `@ApiErrorResponse(status, description)`.
Seules les erreurs réellement possibles sont documentées par endpoint (pas les 9 systématiquement).

## Formats

`uuid`, `date-time`, **`BigInt` public en chaîne décimale** (`type: string`, `pattern: ^[0-9]+$`),
`binary` (multipart), enums **fermées** (V1). En-tête de corrélation **`X-Request-Id`** documenté
(entrant facultatif validé / régénéré ; présent en réponse et dans le corps d'erreur).

## Multipart

`POST /files` : `multipart/form-data`, champ binaire `file` (requis) + `category` (enum) +
`subjectId?`. Compatible `fetch + FormData` (web et React Native `{ uri, name, type }`). Le client
**ne force jamais** `Content-Type: multipart/form-data` (boundary auto).

## Sécurité

Bearer (`addBearerAuth`) requis sur les routes privées (`@ApiBearerAuth`) ; routes publiques
(`health*`, `login`, `refresh`, `logout`) sans `security`. Les permissions
(`files.upload`/`read`/`download`/`delete`/`quarantine`/`restore`) et l'**ownership** sont décrits
dans les descriptions — l'API reste l'autorité réelle (la permission seule ne suffit pas quand
l'ownership est requis). **Aucun** modèle Prisma, secret, `passwordHash`, `tokenHash`, clé de
stockage, bucket, empreinte ni URL signée réelle dans le document (exemples fictifs uniquement).

## Règles de breaking changes

Breaking : suppression de route ; changement méthode/path ; **renommage d'`operationId`** ;
suppression de champ ; optionnel→obligatoire ; type incompatible ; suppression de valeur enum ;
réponse de succès modifiée ; changement d'authentification ; multipart incompatible. Compatibles :
nouvelle route ; nouveau champ optionnel ; nouvelle erreur documentée ; nouvelle valeur enum (avec
prudence). La détection spécialisée (oasdiff/openapi-diff) viendra avec la CI (ADR-016).

## Code généré futur

Les types et clients (`openapi-typescript` + `openapi-fetch` + wrappers Enistere, ADR-016) seront
**générés depuis ce snapshot**, jamais édités à la main, et régénérés à chaque évolution du contrat.
Cette étape (stabilisation) ne génère encore **aucun client**.

## Interdiction

**Ne pas modifier `openapi.json` à la main.** Toute évolution passe par le code + `openapi:generate`,
suivie de `openapi:check` (vérification de fraîcheur). Mettre à jour le CHANGELOG sur tout changement
de contrat public.
