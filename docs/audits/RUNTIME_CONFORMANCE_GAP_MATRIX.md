# Matrice d’écart de conformité des runtimes

Cette synthèse reflète le rapport calculé
[`platform-baseline-v2-gap.json`](../../factory/conformance/reports/platform-baseline-v2-gap.json).
Elle mesure le Platform Baseline `common/2.0.0` et le contrat de famille
`api/2.0.0`, `web/2.0.0` ou `mobile/2.0.0`.

| Runtime | Famille | Conformes | Partiels | Manquants/non conformes | Conforme |
|---|---|---:|---:|---:|:---:|
| NestJS | API | 28 | 0 | 0 | oui |
| Spring Boot | API | 28 | 0 | 0 | oui |
| FastAPI | API | 28 | 0 | 0 | oui |
| Next.js | Web | 24 | 0 | 0 | oui |
| Angular | Web | 24 | 0 | 0 | oui |
| React Native | Mobile | 25 | 0 | 0 | oui |
| Flutter | Mobile | 25 | 0 | 0 | oui |

## Lecture des preuves

- Les trois runtimes API ont des suites comportementales et des goldens avec
  boot et contrat HTTP réel.
- Next.js et Angular ont des suites comportementales Common/Web et des goldens
  avec démarrage Web et contrat E2E de sécurité.
- React Native et Flutter ont des suites comportementales et des goldens avec
  export iOS ou build APK ; aucun test device n’est revendiqué.
- L’évaluation structurelle émet `level: GENERATABLE`. Le statut
  `CONFORMANT` repose en plus sur les suites normatives et les goldens ; il ne
  signifie ni `PRODUCT_EQUIVALENT` ni `PRODUCTION_READY`.

## Invariants de composition

Les sept runtimes sont des sources uniques dans `starters/<runtime>`. Aucun
dossier `base/` ni `composition.baseSource` n’est accepté. Le suffixe historique
`-base` des presets signifie uniquement « aucune capability optionnelle ».

Observability et Technical Audit appartiennent au Platform Baseline. Ils ne sont
jamais classés comme capabilities.

## Action

La prochaine mission unique est l’exécution des profils système canoniques,
d’abord `backend-service` et `product-platform`.
