# Spécification du runtime Angular

## 1. Portée

Ce starter est l’adaptateur Angular du Platform Baseline `common/2.0.0` et du
contrat Web `web/2.0.0`. Il est une source unique directement matérialisée dans
`starters/angular`.

Il ne contient aucune capability. L’authentification, l’autorisation, les
permissions et les fichiers doivent être ajoutés exclusivement par le framework
de capabilities lorsqu’il sera conforme.

## 2. Invariants obligatoires

Le runtime doit fournir :

1. une configuration validée avant usage ;
2. un modèle d’erreur canonique ;
3. des logs JSON avec corrélation et masquage des secrets ;
4. la propagation de `X-Request-Id` et la continuation W3C `traceparent` ;
5. des métriques et traces de requêtes, avec exporteur versionné ;
6. un audit technique structuré, distinct des événements d’audit métier ;
7. des diagnostics assainis, triés et sans secrets ;
8. un cycle de vie démarrage/arrêt idempotent, avec arrêt en ordre inverse ;
9. des extensions versionnées et exclusives pour session et contrôle d’accès ;
10. un routeur, un client `HttpClient` typé et une fondation Reactive Forms ;
11. des états loading, empty, error et success accessibles ;
12. des en-têtes de sécurité portables vers la cible de déploiement ;
13. des gates reproductibles de test, build et démarrage.

## 3. Composition

```text
starters/angular/
├── starter.manifest.json
├── package.json
├── public/
├── e2e/
└── src/app/
    ├── core/
    │   ├── api/
    │   ├── config/
    │   ├── errors/
    │   ├── forms/
    │   ├── interceptors/
    │   └── platform/
    ├── pages/
    └── shared/components/
```

Un dossier `base/` ou une propriété `composition.baseSource` est interdit.

## 4. Preuves

- les invariants Platform et Web ont des tests comportementaux colocalisés ;
- `npm run test:ci` exécute les tests Angular en Chrome Headless ;
- `npm run build` compile la configuration de production ;
- `npm run test:e2e` vérifie le runtime démarré et la politique de sécurité ;
- le golden `nestjs-angular-base` prouve génération, installation, tests, build,
  démarrage et déterminisme du lock.

La conformité n’est déclarée que si ces preuves et l’évaluateur canonique
réussissent.
