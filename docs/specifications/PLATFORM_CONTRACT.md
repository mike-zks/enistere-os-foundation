# Platform Contract

## Objet

Le Platform Contract définit les garanties communes exigées de tout composant Enistere.

## Contrat commun

Tout runtime fournit, selon sa catégorie :

- configuration validée ;
- erreurs normalisées ;
- logs structurés ;
- corrélation ;
- télémétrie ;
- gestion sécurisée des secrets ;
- stratégie de tests ;
- points d’extension ;
- version et migration ;
- documentation d’exploitation.

## API Runtime

- bootstrap reproductible ;
- HTTP sécurisé ;
- validation ;
- enveloppe d'erreur canonique (`ApiErrorResponse`) ;
- OpenAPI ;
- liveness et readiness ;
- persistence integration ;
- migrations et transactions ;
- points d’intégration Auth/Authorization ;
- logs, metrics et tracing ;
- tests unitaires, intégration et contrat.

## Web Runtime

- routage ;
- configuration publique/privée ;
- client API généré ;
- gestion de session ;
- contrôle d’accès ;
- états loading/error/empty ;
- error boundaries ;
- accessibilité ;
- observabilité ;
- tests unitaires et E2E ;
- build et déploiement.

## Mobile Runtime

- navigation ;
- configuration par environnement ;
- secure storage ;
- session ;
- client API ;
- réseau et erreurs ;
- permissions ;
- deep links ;
- observabilité ;
- tests ;
- build Android/iOS ;
- points d’extension offline et notifications.

## Worker Runtime

- idempotence ;
- retry borné ;
- dead-letter handling ;
- graceful shutdown ;
- observabilité ;
- health ;
- configuration ;
- tests.

## Erreur canonique

Toute réponse d'erreur de la famille API utilise l'**enveloppe plate** versionnée `ApiErrorResponse`
(`@enistere/api-contracts`), produite par l'adapter et consommée par le client généré ([ADR-048](../adr/ADR-048-canonical-api-error-contract.md)) :

```json
{
  "success": false,
  "statusCode": 401,
  "errorCode": "AUTH_INVALID_CREDENTIALS",
  "message": "Authentication failed.",
  "details": null,
  "path": "/auth/login",
  "timestamp": "2026-07-23T12:00:00.000Z",
  "requestId": "b3f1c2d4-…"
}
```

- `errorCode` : code applicatif stable au format `DOMAIN_ERROR_REASON` ; la baseline `base` ne déclare que
  ses codes transverses (`VALIDATION_ERROR`, `INTERNAL_SERVER_ERROR`, `SERVICE_UNAVAILABLE`), chaque
  capability composée déclare les siens.
- `message` : générique, non sensible (jamais de stack, de secret ni de détail interne).
- `details` : structures optionnelles (ex. erreurs de validation à plat).
- `requestId` : identifiant de corrélation (en-tête `X-Request-Id`) ; jamais une donnée de sécurité.

Un runtime n’est conforme qu’après passage de la suite Platform Contract.
