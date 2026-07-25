# Runtime Adapter Specification

## Définition

Un runtime adapter implémente le Platform Contract de manière idiomatique pour une technologie.

Exemples :

- `api/nestjs` ;
- `api/spring` ;
- `api/fastapi` ;
- `web/nextjs` ;
- `web/angular` ;
- `mobile/react-native` ;
- `mobile/flutter`.

## Contenu

```text
runtime.yaml
template/
extension-points/
conformance/
golden/
migrations/
README.md
```

## Responsabilités

Le runtime fournit :

- le Platform Baseline commun obligatoire ;
- le contrat de sa famille ;
- bootstrap ;
- structure technique ;
- conventions du framework ;
- points d’extension ;
- intégration des contrats ;
- qualité de base ;
- exécution locale ;
- build.

Il ne définit pas seul Authentication, Authorization, User Management, Files, Events, Notifications ou les
règles métier partagées. Il fournit en revanche obligatoirement l'Observability et le Technical Audit du
Platform Baseline.

## Interchangeabilité

Deux adapters d’une même famille sont interchangeables s’ils :

- implémentent la même version du Platform Contract ;
- supportent les capabilities demandées ;
- passent la même suite ;
- produisent des contrats observables équivalents.

## Variations autorisées

- structure interne ;
- injection de dépendances ;
- annotations ;
- ORM ;
- outils de build ;
- bibliothèques idiomatiques ;
- framework de tests.
