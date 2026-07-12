# QUALITY_CORE_COVERAGE_REPORTING_BASELINE.md — Quality Core coverage/reporting baseline

> Date : 2026-07-12
> Statut Quality Core : **IMPLEMENTATION_AVANCEE** (inchangé)
> Périmètre : synthèse locale tests/couverture, sans workflow obligatoire ni artefact publié

## Synthèse

Quality Core ajoute un helper local de reporting :

```bash
node cores/quality-core/scripts/quality-report.mjs list
node cores/quality-core/scripts/quality-report.mjs markdown
```

Le script produit une synthèse déterministe sur stdout. Il ne lance aucun test, ne lit aucun secret, ne
publie aucun artefact, ne modifie aucun workflow et ne calcule pas de pourcentage global artificiel.

## Livrables

- `cores/quality-core/scripts/quality-report.mjs` ;
- `cores/quality-core/scripts/quality-report.test.mjs`.

## Résultat baseline

| Indicateur | Valeur |
|---|---:|
| Scopes suivis | 8 |
| Coverage disponible localement | 3 |
| Coverage absente ou non standardisée | 5 |

Scopes avec coverage locale disponible :

- `@enistere/ui-kit` : `npm run test:coverage --workspace=@enistere/ui-kit` ;
- `@enistere/web-nextjs` : `npm run test:coverage --workspace=@enistere/web-nextjs` ;
- `cores/api-nestjs` : `cd cores/api-nestjs && npm run test:cov`.

Scopes sans coverage standardisée :

- `@enistere/api-contracts` ;
- `@enistere/api-client-fetch` ;
- `cores/mobile-react-native` ;
- `cores/quality-core` ;
- `cores/docs-core`.

## Décision

Aucun seuil global n'est introduit.

Raison : les outils et périmètres ne sont pas homogènes (`node:test`, Jest, E2E CI, smoke runtime,
tests mobiles locaux, scripts documentaires). Un pourcentage global serait trompeur à ce stade.

## Sécurité / gouvernance

- Sortie stdout uniquement.
- Aucun test lancé par le script.
- Aucun artefact de couverture lu ou publié.
- Aucun appel réseau.
- Aucun workflow GitHub modifié.
- Aucune dépendance ajoutée.
- Les tests Cloud/staging restent des gates finaux gouvernés par runbook.

## Vérifications

| Commande | Résultat |
|---|---|
| `node --test cores/quality-core/scripts/quality-report.test.mjs` | ✅ |
| `node cores/quality-core/scripts/quality-report.mjs list` | ✅ |
| `node cores/quality-core/scripts/quality-report.mjs markdown` | ✅ |

## Hors périmètre

- Pas de publication de couverture.
- Pas de badge coverage.
- Pas de seuil obligatoire.
- Pas de lecture de GitHub Actions.
- Pas de workflow CI.
- Pas de dashboard.

## Prochaine action recommandée

Quality Core coverage standardization decision : décider si les scopes sans coverage standardisée doivent
recevoir une commande coverage locale ou si le baseline reste informatif.
