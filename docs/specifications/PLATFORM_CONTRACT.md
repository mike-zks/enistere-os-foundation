# Platform Contract

## Objet

Le Platform Contract définit les garanties communes exigées de tout runtime Enistere. Sa base normative
est la [Platform Baseline Specification](PLATFORM_BASELINE_SPECIFICATION.md).

## Contrat commun

Tout runtime fournit, selon sa catégorie :

- configuration validée ;
- erreurs normalisées ;
- logs structurés ;
- corrélation ;
- télémétrie ;
- infrastructure d'audit technique ;
- health et diagnostics ;
- gestion sécurisée des secrets ;
- stratégie de tests ;
- lifecycle hooks ;
- points d’extension ;
- build et quality gates ;
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
- journal d'audit générique (infra en base, événements par capability — ADR-056) ;
- rate-limiting (mécanisme en base, limites par endpoint — ADR-056) ;
- points d’intégration Auth/Authorization ;
- logs, metrics et tracing ;
- tests unitaires, intégration et contrat.

Adapters cibles : NestJS, Spring Boot et FastAPI.

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

Adapters cibles : Next.js et Angular. Session et contrôle d'accès sont des hooks de base ; leur
comportement est apporté par les capabilities sélectionnées.

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

Adapters cibles : React Native et Flutter. Offline et Push sont des hooks ; ils ne sont pas activés par
défaut.

## Classification

Observability et Technical Audit sont des invariants obligatoires, jamais des capabilities. Les événements
d'audit métier sont déclarés par les domaines/capabilities et émis via le port du baseline.

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
