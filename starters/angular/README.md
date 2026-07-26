# Starter Angular

Socle Web Angular matérialisé directement à la racine `starters/angular`.

## Statut

- Platform Baseline : `common/2.0.0`
- contrat de famille : `web/2.0.0`
- conformité : prouvée par l’évaluateur de contrat et le golden `nestjs-angular-base`
- composition : modulaire, sans dossier `base` et sans capability embarquée

`Authentication`, `Authorization` et `Files` sont des capabilities planifiées. Elles ne
font pas partie de ce runtime de base.

## Garanties du runtime

- configuration validée au démarrage ;
- erreurs canoniques ;
- journalisation structurée avec masquage ;
- corrélation et continuation W3C `traceparent` ;
- métriques, traces et exporteur de télémétrie versionné ;
- audit technique distinct de l’audit métier ;
- diagnostics assainis et déterministes ;
- hooks de cycle de vie idempotents ;
- points d’extension exclusifs et versionnés pour session et contrôle d’accès ;
- routage, client HTTP typé, fondation de formulaires et états UI accessibles ;
- politique d’en-têtes de sécurité déployable ;
- tests unitaires, build production et preuve E2E au démarrage.

## Commandes

```bash
npm ci
npm run test:ci
npm run build
npm run test:e2e
```

La spécification normative locale est
[`STARTER_SPECIFICATION.md`](./STARTER_SPECIFICATION.md). Les contrats canoniques
sont définis dans `factory/contracts/runtime/`.
