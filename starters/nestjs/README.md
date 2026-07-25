# Starter API NestJS

Socle API NestJS 11 / TypeScript conforme au contrat cible
`Platform Baseline 2.0.0` et au contrat de famille `api/2.0.0`.

Le starter ne contient aucune capability implicite. Authentication, Authorization,
Files et Events se composent par overlays et se branchent sur des ports versionnés.

## Exécution

```bash
npm ci
npm run prisma:generate
npm run build
npm test
npm run test:e2e
npm run start:dev
```

Copier `.env.example` vers `.env` et renseigner au minimum `DATABASE_URL`.

## Platform Baseline

- configuration typée et validée ;
- erreurs HTTP canoniques ;
- logs JSON Pino avec redaction ;
- corrélation `X-Request-Id` et propagation W3C `traceparent` ;
- métriques HTTP bornées et hook `telemetry/2.0.0` pour OpenTelemetry ;
- audit technique distinct des logs ;
- Helmet, CORS explicite, limites de payload et throttling ;
- `/health`, `/health/live`, `/health/ready` ;
- lifecycle coordonné et arrêt gracieux sur signaux ;
- tests unitaires, contractuels et E2E ;
- build, lint et vérification OpenAPI.

## Points d’extension API

`src/platform/extensions` expose le contrat `api-extension/2.0.0` :

- `AuthenticationHook` ;
- `AuthorizationHook` ;
- `FileHook` ;
- `EventHook`.

`RuntimeExtensionRegistry` refuse une version incompatible ou plusieurs providers
actifs pour un même point. Il n’active aucun comportement métier par défaut.

## Observabilité

`RequestContextMiddleware` :

1. continue ou crée un contexte W3C ;
2. propage le `traceId` dans `AsyncLocalStorage` et les logs ;
3. émet une mesure HTTP à la fin de la réponse ;
4. transmet cette mesure à l’exporter OpenTelemetry lorsqu’un adapter est enregistré.

Le starter n’impose ni SDK, ni exporter, ni backend de télémétrie. Ceux-ci relèvent
des adapters et primitives de déploiement.

## Arrêt

`enableShutdownHooks()` relie SIGTERM/SIGINT aux hooks NestJS.
`RuntimeLifecycleService` exécute les hooks additionnels en ordre inverse
d’inscription et garantit leur idempotence.

## Composition

La Factory génère `src/composition/capabilities.ts`, les fragments Prisma,
les migrations et les variables d’environnement nécessaires aux capabilities
sélectionnées. Le terme historique `base` ne représente plus une capability.

## Limites prouvées

Le scan structurel reste étiqueté `GENERATABLE`, mais les 28 invariants
Common/API v2 sont conformes et leurs scénarios comportementaux sont exécutés par
les quality gates. Le golden `nestjs-base` doit en plus démarrer et réussir le
contrat HTTP réel en CI. Ces preuves ne valent ni parité produit, ni backend
OpenTelemetry imposé, ni statut `PRODUCTION_READY`.

Voir [STARTER_SPECIFICATION.md](./STARTER_SPECIFICATION.md) et le rapport calculé
`factory/conformance/reports/platform-baseline-v2-gap.json`.
