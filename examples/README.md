# Examples

Exemples consommateurs minimaux pour prouver l'usage concret de la Foundation hors des cores.

## Exemples disponibles

| Exemple | Objectif | Backend requis |
|---|---|---|
| [`api-client-node`](./api-client-node/) | Consommer `@enistere/api-contracts` et `@enistere/api-client-fetch` depuis un script Node avec `fetch` injecte | Non, `fetch` est mocke |

Ces exemples ne remplacent pas les tests des cores. Ils servent a reduire la friction d'adoption :
un lecteur doit pouvoir comprendre rapidement comment consommer les artefacts officiels.

Les prochains exemples derives doivent suivre les scenarios de
[`docs/project-factory/USE_CASE_SCENARIOS.md`](../docs/project-factory/USE_CASE_SCENARIOS.md) et le modele
de composition de [`CORE_COMPOSITION_MODEL.md`](../docs/project-factory/CORE_COMPOSITION_MODEL.md). Un
exemple derive doit rester isole des runtimes Foundation et indiquer sa provenance/version.
