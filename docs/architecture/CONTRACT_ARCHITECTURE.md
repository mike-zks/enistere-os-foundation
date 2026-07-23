# Architecture des contrats

## Sources canoniques

```text
contracts/
├── http/
├── schemas/
├── events/
├── errors/
├── permissions/
└── telemetry/
```

## Standards

- OpenAPI pour HTTP ;
- JSON Schema pour les structures ;
- AsyncAPI ou schémas versionnés pour les événements ;
- enveloppe d'erreur canonique versionnée (`ApiErrorResponse`) pour les erreurs ([ADR-048](../adr/ADR-048-canonical-api-error-contract.md)) ;
- identifiants versionnés pour les permissions.

## Génération polyglotte

```text
Canonical Contracts
├── TypeScript models and clients
├── Java DTOs and interfaces
├── Dart models and clients
├── server bindings
└── test fixtures
```

Aucun package TypeScript n’est la source unique d’un contrat polyglotte.

## Versionnement

- changement compatible : version mineure ;
- changement incompatible : nouvelle version ;
- événements suffixés `.v1`, `.v2` ;
- coexistence temporaire selon politique de support.

## Contract-first

Les adapters serveur et client sont validés contre la source canonique.
