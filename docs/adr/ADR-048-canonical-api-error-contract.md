# ADR-048 — Contrat d'erreur canonique de la famille API

- Statut : Validé
- Date : 2026-07-23
- Décideur : Owner Foundation

## Contexte

[ADR-047](ADR-047-executable-platform-contract-api.md) a rendu la conformité API mesurable et a constaté que
**ni NestJS ni Spring n'émettent le Problem Details** exigé par [`PLATFORM_CONTRACT`](../specifications/PLATFORM_CONTRACT.md)
et [`CONTRACT_ARCHITECTURE`](../architecture/CONTRACT_ARCHITECTURE.md) : la forme d'erreur y était **mesurée
non conforme des deux côtés** et sa convergence différée à cet ADR.

L'analyse directe (Phase A) a établi que l'**enveloppe plate** est le contrat d'erreur **réel, versionné et
bout-en-bout**, et non une bricole :

- **type partagé** `ApiErrorResponse` dans `@enistere/api-contracts` ;
- **émise** par NestJS (`AllExceptionsFilter`) et **documentée** en OpenAPI (`ApiErrorResponseDto`) ;
- **consommée** par le client généré `@enistere/api-client-fetch` (`isApiErrorBody`, `ApiClientError` :
  `errorCode`/`status`/`details`/`requestId`), puis par le Web et le Mobile via ce client ;
- corrélée par `requestId` (en-tête `X-Request-Id`) — celui que le `CorrelationIdFilter` (ADR-047) pose déjà
  côté Spring.

Le Problem Details (RFC 7807) de la spec était **aspirationnel et jamais implémenté** ; y migrer changerait le
type partagé versionné, le client et les deux adapters, et régénérerait le client consommé par toutes les
apps — un REFACTOR d'un contrat qui fonctionne, sans besoin d'interopérabilité mesuré (client first-party
généré depuis le même contrat).

## Décision

Adopter l'**enveloppe plate** comme **contrat d'erreur canonique** de la famille API :

```json
{
  "success": false,
  "statusCode": 404,
  "errorCode": "FILE_NOT_FOUND",
  "message": "File not found.",
  "details": null,
  "path": "/files/123",
  "timestamp": "2026-07-23T12:00:00.000Z",
  "requestId": "b3f1c2d4-…"
}
```

- `errorCode` : code applicatif stable au format `DOMAIN_ERROR_REASON` ; `message` : message générique non
  sensible (jamais de stack, secret ni détail interne) ; `details` : structures optionnelles (ex. erreurs de
  validation) ; `requestId` : corrélation (`X-Request-Id`), pas une donnée de sécurité.
- **Corriger la spécification (§5)** : `PLATFORM_CONTRACT` et `CONTRACT_ARCHITECTURE` décrivent désormais
  cette enveloppe (et non le Problem Details) ; le standard d'erreur (format + catalogue de codes) est
  **re-homé** depuis la doc défunte `strategy/08_STANDARDS.md` vers `PLATFORM_CONTRACT`.
- **Converger Spring** : `ApiError` et `GlobalExceptionHandler` émettent l'enveloppe plate, avec `requestId`
  issu du `CorrelationIdFilter` (ADR-047). Le client, NestJS et le contrat partagé restent **inchangés**.
- **Nettoyer les références erreur** à `08_STANDARDS` dans le code (les pointer vers `PLATFORM_CONTRACT`).

## Conséquences positives

- **parité produit atteinte** sur l'erreur : Nest et Spring émettent la même enveloppe versionnée ;
- la spécification **dit la vérité** (fin de la divergence spec↔code sur l'erreur) ;
- `enistere.conformance.json` : `error-canonical` passe **`non-conformant` → `compliant`** des deux côtés ;
- aucun changement du contrat versionné `@enistere/api-contracts` ni du client → risque minimal.

## Coûts et risques

- Le corps d'erreur **Spring** change (`ApiError` → enveloppe plate) : *breaking* pour un consommateur
  Spring-spécifique existant, mais **aligne** Spring sur le contrat que le client attend déjà (corrige la
  divergence). `golden-runtime spring-*` protège la non-régression.
- Le format bespoke n'est pas RFC 7807 : interopérabilité externe non standard (choix assumé ; réversible via
  un futur ADR si un besoin d'interop tiers émerge).

## Périmètre

Inclus : contrat d'erreur canonique (enveloppe plate) ; correction `PLATFORM_CONTRACT` + `CONTRACT_ARCHITECTURE` ;
convergence Spring (`ApiError`, `GlobalExceptionHandler`) ; mise à jour de l'évaluateur de conformité (cible =
enveloppe plate) ; re-homing du standard d'erreur et nettoyage des **références erreur** à `08_STANDARDS`.

Exclus : autres sections de `08_STANDARDS` (Java §16, Reactive Forms §20, config URL — dette séparée) ; gestion
d'erreur Web/Mobile (déjà via le client) ; parité du **schéma OpenAPI** d'erreur côté Spring (springdoc — suivi
séparé) ; Auth/RBAC/Files au-delà du re-pointage de leurs fichiers de codes ; Problem Details.

## Alternatives rejetées

- **Problem Details RFC 7807** : gros périmètre (type partagé + client + 2 adapters + régénération), sans
  besoin d'interop mesuré.
- **Négociation de contenu (`application/problem+json` + champs plats)** : deux représentations, complexité
  contraire au §8.2.

## Migration

- Spring : `ApiError{status,code,message,errors,timestamp,path}` → `{success,statusCode,errorCode,message,details,path,timestamp,requestId}`
  (`status`→`statusCode`, `code`→`errorCode`, `errors[]`→`details`, ajout `success:false` + `requestId`).
- Clients : **aucun changement** (le client attendait déjà cette forme).
- Documentation : re-pointage des références `08_STANDARDS` (erreur) vers `PLATFORM_CONTRACT`.

## Tests

- Suite de conformité : `error-canonical` = `compliant` sur Nest **et** Spring générés.
- `factory:test` complet ; Spring généré `mvnw verify` vert (golden Spring non régressé).
- Le corps d'erreur Spring reste consommable par `isApiErrorBody`/`ApiClientError` (test de forme).

## Rollback

- `git revert` de la convergence Spring : Spring re-signalé non conforme par `conformance.json` ; specs et
  ADR restent (la décision de contrat tient), ou revert complet du lot documentaire si la décision est annulée.

## Suite

Missions séparées : logs structurés + observabilité API ; parité du schéma OpenAPI d'erreur ; extension du
Platform Contract exécutable aux familles Web et Mobile ; nettoyage des sections **non-erreur** de `08_STANDARDS`.
