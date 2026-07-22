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
- Problem Details étendu ;
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

```json
{
  "type": "https://errors.enistere.io/auth/invalid-credentials",
  "title": "Invalid credentials",
  "status": 401,
  "code": "AUTH_INVALID_CREDENTIALS",
  "detail": "Authentication failed.",
  "correlationId": "..."
}
```

Un runtime n’est conforme qu’après passage de la suite Platform Contract.
