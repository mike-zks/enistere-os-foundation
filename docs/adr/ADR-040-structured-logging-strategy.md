# ADR-040 — Stratégie de logging structuré du API Core NestJS V1

## 1. Titre

Choix du moteur et de la stratégie de logging structuré (logs techniques) du API Core NestJS V1.

## 2. Statut

Validé.

## 3. Date

2026-06-08.

## 4. Contexte

Le API Core NestJS est l'autorité applicative d'Enistere OS Foundation. La revue d'étape globale
(`docs/API_CORE_V1_REVIEW.md`, `docs/API_CORE_V1_NEXT_ROADMAP.md`) a conclu à un starter sain et
durci (Auth/RBAC, Files, sécurité HTTP, 354 tests unitaires, 83 e2e, 0 vulnérabilité) et a désigné
le **logging structuré et l'observabilité minimale** comme **prochain module recommandé**, à
formaliser par ADR avant toute implémentation.

État actuel du logging dans le starter :

- **Logger standard NestJS** (`bufferLogs: true` au bootstrap, quelques `logger.warn` ciblés, ex.
  `AuditService` en cas d'échec de persistance) ;
- **`AuditModule` persistant** (`AuditService` → table `AuditLog`), non bloquant, sans secret ;
- **Identifiant de corrélation** `X-Request-Id` (`src/common/middleware/request-id.middleware.ts`) :
  validé-ou-généré, exposé en réponse, attaché à `req.requestId` ; **pas une donnée de sécurité** ;
- **Filtre global** `AllExceptionsFilter` (enveloppe d'erreur plate, `errorCode` générique) et
  **interceptor global** `ResponseInterceptor` (enveloppe de succès) ;
- **Commandes CLI** (`files:reconcile`, `files:cleanup-pending`, `files:purge-metadata`,
  `openapi:generate`, `benchmark:argon2`) produisant un **résultat JSON machine sur stdout** + exit
  codes, sans secret ;
- **Sondes** `GET /health`, `/health/live`, `/health/ready`.

Le backlog ADR (`docs/adr/ADR_BACKLOG.md`) réserve `ADR-016` à OpenAPI, `ADR-018` au monitoring
avancé (Prometheus/Grafana/Loki/Sentry) et `ADR-036` à l'observabilité distribuée/tracing. Aucun
identifiant n'est réservé au **logging structuré applicatif** lui-même. Les identifiants `016`→`038`
étant déjà réservés et `039` utilisé, le prochain identifiant **réellement disponible** est
`ADR-040`, retenu ici. Cette ADR décide du **moteur de logs techniques** ; le monitoring/tracing
(ADR-018/ADR-036) et la collecte côté Deployment restent hors de son périmètre de décision.

## 5. Problème

Le starter ne possède pas encore :

- des logs **JSON structurés uniformes** (API + CLI) ;
- un **contexte automatique par requête** (requestId, route, durée) ;
- une **redaction centralisée** des données sensibles ;
- une **durée HTTP standardisée** ni un log de fin de requête commun ;
- une **politique de niveaux par environnement** ;
- une **préparation explicite** de la collecte (Loki/Grafana) et du tracing (OpenTelemetry).

Le futur système doit rester **générique, performant, testable, sécurisé, indépendant d'un
fournisseur d'observabilité et compatible avec le Deployment**, sans introduire de fuite de secrets
ni de régression NestJS 11.

## 6. Objectifs

1. Choisir un **moteur officiel** de logging structuré et son mode d'intégration NestJS 11.
2. Définir un **schéma de log V1** commun (API et CLI) et une **redaction centralisée**.
3. Réutiliser le **request ID existant** comme contexte de corrélation (pas de second système).
4. Standardiser les **logs HTTP** (méthode, route normalisée, statusCode, durée).
5. **Séparer** strictement logs techniques et `AuditLog` (sécurité/métier).
6. Émettre du **JSON sur stdout/stderr** ; déléguer **collecte/Loki/Grafana au Deployment**.
7. Préparer **OpenTelemetry** (champs `traceId`/`spanId`) sans le rendre obligatoire.
8. Garantir **compatibilité tests/perf** et **absence de secret** dans toute sortie.

## 7. Non-objectifs

- N'implémente aucun code, n'ajoute aucune dépendance npm (ADR documentaire).
- Ne configure ni Pino, ni middleware/interceptor de logging, ni transport.
- Ne crée ni Loki, ni Grafana, ni Prometheus, ni OpenTelemetry, ni Docker, ni CI/CD.
- Ne remplace pas `AuditModule` (audit fonctionnel/sécurité persistant).
- Ne décide pas du backend d'observabilité (relève d'ADR-018 / du Deployment).

## 8. Options étudiées

- **Option A — Logger NestJS personnalisé** (implémentation `LoggerService` interne produisant du
  JSON, sans dépendance externe).
- **Option B — Pino intégré directement** (`pino` + `pino-http`, câblage maison dans NestJS).
- **Option C — `nestjs-pino`** (`nestjs-pino` + `pino-http`, intégration NestJS, contexte de requête,
  remplacement du logger NestJS, logs HTTP automatiques).
- **Option D — Winston** (intégration NestJS adaptée, transports nombreux).

## 9. Comparaison

| Critère | A — Logger maison | B — Pino direct | C — nestjs-pino | D — Winston |
|---|---|---|---|---|
| Compatibilité NestJS 11 | ✅ (maison) | ✅ (câblage maison) | ⚠️ **à prouver** | ✅ |
| Performances | ⚠️ selon impl. | ✅ (très rapide) | ✅ (Pino) | ⚠️ moins adapté |
| JSON structuré natif | ⚠️ à construire | ✅ | ✅ | ✅ (config) |
| Contexte de requête | ❌ à construire | ⚠️ ALS à câbler | ✅ fourni | ⚠️ à câbler |
| Request ID | ⚠️ manuel | ⚠️ câblage | ✅ intégré | ⚠️ manuel |
| Redaction | ❌ à écrire | ✅ (`redact`) | ✅ (`redact`) | ⚠️ à composer |
| Serializers | ❌ | ✅ | ✅ | ⚠️ |
| Logs HTTP | ❌ | ✅ (`pino-http`) | ✅ auto | ⚠️ middleware |
| Logs applicatifs | ✅ | ✅ | ✅ | ✅ |
| Logs CLI (ApplicationContext) | ✅ | ✅ | ⚠️ (logger Nest hors HTTP) | ✅ |
| Logs bootstrap | ⚠️ | ✅ (`bufferLogs`) | ✅ (`bufferLogs`) | ✅ |
| Intégration tests | ✅ | ✅ (level silent) | ✅ (level silent) | ✅ |
| Transport Loki futur | n/a (stdout) | ✅ (stdout) | ✅ (stdout) | ⚠️ (transports) |
| OpenTelemetry futur | ⚠️ à câbler | ✅ (mixin/ALS) | ✅ (mixin) | ⚠️ |
| Maintenance | ❌ (réinvention) | ⚠️ moyenne | ✅ faible | ⚠️ |
| Dépendances ajoutées | 0 | `pino`,`pino-http`(+`pino-pretty` dev) | `nestjs-pino`,`pino-http`(+`pino-pretty` dev) | `winston`(+`nest-winston`) |
| Stabilité | ⚠️ | ✅ | ✅ | ✅ |
| Expérience dev | ⚠️ | ⚠️ (câblage) | ✅ | ⚠️ |
| Lock-in | aucun | faible | moyen (couche Nest) | moyen |
| Coût de migration | élevé (vers une vraie lib) | faible→C | faible→B | élevé |

**Lecture** : A revient à réinventer une bibliothèque de logging (rejeté). D est mature mais plus
lourd et moins adapté au débit HTTP/JSON natif (surdimensionné pour la V1). B et C s'appuient tous
deux sur **Pino** (JSON natif, performances, redaction, serializers) et partagent le même format de
sortie : la migration B↔C est faible.

## 10. Décision

1. **Pino est le moteur officiel de logging structuré** du API Core NestJS V1 (logs techniques).
2. **`nestjs-pino` est l'intégration préférée**, **sous réserve** d'une **preuve de compatibilité
   complète** avec NestJS 11 et le starter (checklist §29).
3. **L'intégration Pino directe** (`pino` + `pino-http`, câblage maison) est la **stratégie de repli
   officielle** si la preuve échoue sur un point structurel non corrigeable proprement (§30).
4. Les **logs de production sont du JSON envoyé sur stdout/stderr**. **La collecte, Loki et Grafana
   relèvent du Deployment** (l'API n'embarque aucun transport distant).
5. **`AuditLog` reste séparé des logs techniques** : ni l'un ne remplace l'autre.

Ce **mécanisme de décision est imposé** : un projet dérivé ne choisit pas librement le moteur ni le
mode d'intégration ; il applique B ou C selon le résultat de la preuve, et conserve Pino comme
moteur. Aucune dépendance n'est ajoutée par cette ADR.

## 11. Architecture retenue

- **Moteur** : Pino (directement ou via `nestjs-pino`).
- **Sortie** : un flux JSON par ligne (NDJSON) sur **stdout** (et **stderr** pour les CLI, §23) ;
  pas de pretty-print en production, pas d'écriture fichier applicative, pas de transport réseau dans
  le processus.
- **Logger applicatif** : un logger injectable unique remplace l'usage direct du `Logger` NestJS ;
  les modules logguent via ce logger avec un `context` stable (nom de classe/module).
- **HTTP** : un log de **fin de requête** standardisé (via `pino-http` ou un intercepteur/équivalent
  selon B/C), enrichi du contexte de requête.
- **Contexte de requête** : porté par le mécanisme de la solution retenue (contexte `nestjs-pino`
  en C ; `AsyncLocalStorage` en B), alimenté par le `requestId` **existant**.
- **Bootstrap** : `bufferLogs: true` conservé pour capter les logs de démarrage via le logger final.
- **CLI** : résultat **machine sur stdout**, **logs techniques sur stderr** (§23).

## 12. Schéma de log V1

Champs communs minimaux (présence conditionnelle marquée `?`) :

```text
timestamp        # ISO 8601 / epoch ms
level            # fatal|error|warn|info|debug|trace
message
context          # ex. "FileUploadService", "HTTP", "CLI:reconcile"
service          # "api-nestjs-core"
environment      # development|test|staging|production
requestId?       # corrélation HTTP (ou operationId hors HTTP)
method?          # HTTP
route?           # ROUTE NORMALISÉE (ex. /files/:id), jamais l'URL avec identifiants/query
statusCode?
durationMs?
userId?          # UUID uniquement, après authentification, avec modération
sessionId?       # UUID uniquement, avec modération
operation?       # nom d'opération technique (CLI/job)
errorCode?       # code applicatif (error-codes.ts)
errorType?       # classe d'erreur (ex. "ServiceUnavailableException")
traceId? spanId? # réservés OpenTelemetry (futur, non obligatoires)
```

**Interdits par défaut** dans tout log : email, IP (sans justification), body complet, query
complète, URL signée, `storageKey`, `bucket`, `checksum`, token/secret, buffer/contenu de fichier.
`route` doit être **normalisée** (paramètres remplacés par `:id`), jamais l'URL brute.

## 13. Niveaux

| Environnement | Niveau par défaut | Notes |
|---|---|---|
| production | `info` (et `warn`/`error`/`fatal`) | `debug`/`trace` désactivés |
| staging | `debug` possible | sous configuration contrôlée |
| development | `debug` | pretty-print local optionnel |
| test | `silent` (ou `error`) | éviter le bruit dans les sorties capturées |

Niveau **configurable et validé** via `LOG_LEVEL=` (à ajouter à la configuration validée lors de
l'implémentation, valeurs autorisées : `fatal|error|warn|info|debug|trace|silent`).

## 14. Request ID

- **Réutiliser** le middleware existant `X-Request-Id` ; **un seul** request ID par requête.
- Propagé dans **les logs HTTP** et **les logs applicatifs** émis pendant la requête, et présent dans
  la **réponse**.
- **Format entrant validé** (déjà en place : `^[A-Za-z0-9._-]{8,128}$`, sinon UUID généré).
- **Aucune confiance de sécurité** dans cet ID (non authentifié).
- Modes évalués : (1) passage manuel — **rejeté** (verbeux, fragile) ; (2) `AsyncLocalStorage` ;
  (3) contexte fourni par `nestjs-pino`. **Décision** : utiliser le **contexte de requête de la
  solution retenue** (ALS en B, contexte intégré en C) ; **ne pas dupliquer** deux systèmes de
  request ID concurrents.

## 15. Contexte asynchrone

Pour les contextes **hors HTTP** (commandes CLI, futurs jobs/workers/maintenance), utiliser un
**`operationId`** (ou un `requestId` généré localement si le contrat le permet) ; **ne pas supposer**
qu'un worker possède une requête HTTP. Le contexte est porté par `AsyncLocalStorage` (ou l'équivalent
de la solution) ; un seul mécanisme de contexte est maintenu.

## 16. Logs HTTP

Un **log de fin de requête** contient au minimum : `requestId`, `method`, `route` normalisée,
`statusCode`, `durationMs`. Optionnel et **catégorisé** seulement : `contentLength`, `userAgent`
catégorisé. **Jamais** automatiquement : `Authorization`, `Cookie`, body, query complète, URL signée,
multipart, buffer. **Politique de bruit** : réduire/désactiver les logs de **succès** très fréquents
de `/health/live` et `/health/ready` (conserver erreurs et changements d'état) ; filtrer Swagger en
développement si nécessaire. Éviter tout **double log HTTP** (un seul log de fin de requête).

## 17. Redaction

Liste **centralisée** (jamais dispersée par module) de chemins/champs sensibles, au minimum :

```text
authorization, cookie, set-cookie, password, passwordHash, accessToken, refreshToken,
tokenHash, jwt, secret, clientSecret, accessKey, secretKey, DATABASE_URL,
S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET,
REFRESH_TOKEN_HASH_SECRET, signedUrl / url signée
```

Couvrir : **variantes de casse**, **headers**, **champs imbriqués**, **query strings**, **erreurs**
pouvant contenir une configuration, **objets SDK** (AWS/Prisma). La redaction s'appuie sur la
fonctionnalité native `redact` de Pino + des **serializers** dédiés (erreurs, requête/réponse). La
valeur masquée est remplacée par un marqueur (`[Redacted]`), jamais omise silencieusement quand le
champ existe.

## 18. Politique sur les bodies

**Ne jamais journaliser automatiquement** les request/response bodies. Exceptions limitées : champs
**techniques explicitement sélectionnés** (jamais de secret, fichier, buffer, donnée personnelle ni
payload complet). Pour les **uploads** : ne jamais logger le contenu binaire, le nom original complet
si sensible, la `storageKey`, le `checksum`, l'URL signée.

## 19. Erreurs

- **5xx** → `error` ; **429 et anomalies de sécurité** → `warn` ; **4xx attendues** → `info`/`debug`
  selon le type ; **refus Auth/RBAC sensibles** → **audit + log ciblé** (pas de double log massif).
- Champs : `errorType`, `errorCode`, message **interne contrôlé**, `stack` (logs techniques
  **uniquement**, jamais dans la réponse), `cause` (filtrée).
- **Ne pas sérialiser aveuglément** une erreur AWS/Prisma ; **ne pas laisser** une `cause` inclure une
  chaîne de connexion ou des credentials (serializer d'erreur + redaction). Messages **publics** et
  logs **internes** restent séparés (cf. `AllExceptionsFilter`, enveloppe générique).

## 20. Identité utilisateur

- **Pas d'identité** dans les logs **avant authentification**.
- Après authentification : `userId`/`sessionId` possibles, **UUID uniquement**, **avec modération**.
- **Jamais** : email, rôles/permissions complets, token. **Ne pas muter** un contexte global partagé
  entre requêtes (contexte par requête isolé).

## 21. AuditLog

`AuditLog` (table) reste la destination de l'**audit fonctionnel/sécurité** (login, réutilisation de
refresh, changement de rôle, upload, suppression, quarantaine, refus d'autorisation, etc.). **Règle
impérative** :

```text
AuditLog ne remplace pas les logs techniques.
Les logs techniques ne remplacent pas AuditLog.
```

Un événement critique peut produire **un audit persistant + un log technique minimal**, sans
duplication excessive ni donnée sensible. L'audit demeure non bloquant et sans secret.

## 22. Files

Les logs techniques du domaine Files ne contiennent **jamais** : `buffer`, `originalName` sensible,
`storageKey`, `bucket`, `checksum`, `signedUrl`, credentials. Les événements Files restent audités
via `AuditLog` (cf. `FILES_REVIEW.md`). Cohérent avec la redaction (§17) et la politique upload (§18).

## 23. CLI

Les commandes `files:reconcile`, `files:cleanup-pending`, `files:purge-metadata`, `openapi:generate`,
`benchmark:argon2` doivent conserver leur **résultat machine JSON**, leurs **exit codes** et
l'**absence de secret**. Les logs **ne doivent pas corrompre** un JSON attendu sur stdout. **Décision** :

```text
résultat machine → stdout
logs techniques  → stderr
```

(ApplicationContext NestJS : le logger écrit sur stderr ; le `console.log` du résultat machine reste
sur stdout). Cette convention est documentée et testée à l'implémentation.

## 24. Transports

```text
L'API écrit des logs JSON sur stdout/stderr.
Le Deployment est responsable de la collecte et de l'expédition.
```

**Aucun envoi direct vers Loki** depuis un module applicatif en V1. Aucun transport **réseau
synchrone** dans le chemin HTTP ; pas d'écriture fichier applicative standard. Un transport Pino
local (`pino-pretty`) est autorisé **uniquement** en développement (dépendance **dev**, jamais requise
au runtime de production). Bénéfices : séparation applicatif/infrastructure, moins de secrets
d'observabilité dans l'API, résilience, portabilité.

## 25. Loki

Chaîne cible : `API stdout JSON → agent Deployment → Loki → Grafana`. **Labels Loki peu nombreux**
recommandés : `service`, `environment`, `level`. **Ne pas** transformer en labels (cardinalité) :
`requestId`, `userId`, `sessionId`, `fileId`, route brute, message d'erreur — ces champs restent dans
le **corps** du log JSON, recherchables sans exploser la cardinalité.

## 26. OpenTelemetry

Le schéma de log réserve `traceId`/`spanId` afin d'accueillir plus tard une corrélation logs↔traces,
**sans rendre OpenTelemetry obligatoire** maintenant. Aucune intégration OpenTelemetry n'est créée
par cette ADR (relève d'ADR-036 / du Deployment).

## 27. Performances

- **Aucun transport distant synchrone** dans le chemin HTTP.
- Sérialisation JSON rapide (Pino) ; redaction native ; pretty-print **dev uniquement**.
- Attention au **volume HTTP** (un seul log de fin de requête ; bruit health réduit) et aux
  **fichiers multipart** (jamais de buffer loggé). Surveiller la backpressure stdout (le collecteur
  Deployment consomme stdout). Niveau `production` = `info` (pas de `debug`/`trace`).

## 28. Tests

L'implémentation devra prouver : `build`, `lint`, **tests unitaires**, **tests e2e**, parsing/snapshot
de logs, **redaction** (aucun secret dans les sorties capturées), propagation **request ID**, logs de
**bootstrap**, logs **CLI** (stdout JSON intact, logs sur stderr), **absence de bruit excessif** en
test (niveau `silent`/`error`). Des **tests de redaction dédiés** sont obligatoires.

## 29. Compatibilité NestJS 11 (preuve avant adoption de `nestjs-pino`)

L'adoption définitive de `nestjs-pino` est **conditionnée** à une preuve validant :

1. compatibilité NestJS 11 ; 2. aucune alerte de routes legacy non maîtrisée ; 3. global prefix ;
4. middleware existant (request ID) ; 5. request ID (un seul) ; 6. Passport ; 7. Multer ;
8. `AllExceptionsFilter` ; 9. `ResponseInterceptor` ; 10. CLI `ApplicationContext` ; 11. Jest ;
12. e2e ; 13. logs de bootstrap ; 14. arrêt propre ; 15. performance raisonnable.

Si **l'un** de ces points révèle un défaut structurel non corrigeable proprement → **repli Pino
direct** (§30).

## 30. Stratégie de repli

Repli officiel : **Pino intégré directement** (`pino` + `pino-http`, contexte via
`AsyncLocalStorage`, logger custom implémentant `LoggerService` de NestJS). Le **format de sortie, le
schéma de log, la redaction, les niveaux, la séparation Audit/Logs et la convention CLI sont
identiques** à l'option `nestjs-pino` : la décision (Pino, JSON stdout, Deployment) ne change pas, seul
le **câblage** diffère. La migration C→B (ou inverse) est faible et n'impacte pas les consommateurs.

## 31. Conséquences positives

Logs structurés et uniformes (API+CLI) ; recherche facilitée ; contexte de requête automatique ;
redaction centralisée ; performances (Pino) ; préparation Loki et OpenTelemetry ; meilleure
exploitabilité ; cohérence avec `X-Request-Id` et le durcissement déjà livrés ; indépendance vis-à-vis
d'un fournisseur d'observabilité.

## 32. Conséquences négatives

Dépendances supplémentaires (Pino, `pino-http`, +`pino-pretty` dev ; éventuellement `nestjs-pino`) ;
migration du logger NestJS existant ; risque de duplication de logs si mal câblé ; complexité de
l'`AsyncLocalStorage` (repli) ; nécessité de tests de sécurité (redaction) ; compatibilité
`nestjs-pino`/NestJS 11 à prouver ; volume de logs à maîtriser ; coût de stockage Loki futur (côté
Deployment).

## 33. Risques

Tokens/mots de passe dans les logs ; URL signée journalisée ; request/response body journalisé ;
cardinalité Loki excessive ; **double request ID** ; **double log HTTP** ; perte du contexte
asynchrone ; pretty-print activé en production ; transport distant bloquant ; **logs CLI corrompant
stdout** (JSON machine) ; erreurs Prisma/AWS contenant des informations sensibles ; logs trop
verbeux ou insuffisants ; incompatibilité NestJS 11. Chaque risque est adressé par les sections
§14–§28 (un seul request ID, un seul log HTTP, redaction centralisée, stderr pour les logs CLI,
serializers d'erreur, niveaux par environnement, preuve de compatibilité).

## 34. Règles pour les agents IA (Codex / Claude Code)

- **Jamais** de `console.log` dans le code applicatif (utiliser le logger officiel ; le résultat
  machine CLI sur stdout reste autorisé et documenté).
- **Toujours** le logger officiel ; **jamais** logger un objet requête complet, un DTO sensible, ni
  une erreur externe brute.
- **Jamais** de token, mot de passe, buffer, URL signée, `storageKey`, `bucket` ou `checksum`.
- Utiliser des **champs structurés** et un **`context` stable** ; ne pas réinventer un format.
- **Ajouter des tests de redaction** ; respecter la **séparation Audit/Logs**.

## 35. Conditions de révision

Réviser cette ADR si : `nestjs-pino` devient incompatible avec NestJS ; NestJS change son
architecture de logger ; passage à Fastify ; ajout d'OpenTelemetry (ADR-036) ; ajout d'un transport
Loki direct ; migration vers un autre moteur ; exigences de conformité réglementaire ; exigences de
chiffrement ou de rétention spécifiques des logs.

## 36. Conclusion

Le API Core NestJS V1 adopte **Pino** comme moteur officiel de logging structuré, avec **`nestjs-pino`
comme intégration préférée sous réserve d'une preuve de compatibilité NestJS 11** et **l'intégration
Pino directe comme repli officiel**. Les logs de production sont du **JSON sur stdout/stderr** ; la
**collecte, Loki et Grafana relèvent du Deployment** ; **`AuditLog` reste séparé** des logs
techniques. Cette ADR ne crée aucun code ni dépendance : elle cadre une stratégie de logging sûre,
performante, testable et compatible Deployment, à implémenter dans une mission dédiée guidée par la
checklist de compatibilité (§29) et la stratégie de repli (§30).
