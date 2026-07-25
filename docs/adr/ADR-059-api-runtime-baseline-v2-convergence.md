# ADR-059 — Convergence Common/API v2 de NestJS et Spring Boot

- Statut : accepté
- Date : 2026-07-24
- Décideurs : Enistere OS Foundation
- Complète : ADR-057, ADR-058

## Décision

NestJS et Spring Boot exposent les mêmes invariants exécutables de lifecycle,
d’extension, de sécurité et d’observabilité. Les preuves critiques sont des tests
comportementaux propres à chaque framework, agrégés par le même évaluateur
Common/API v2.

## Contexte

Le premier rapport Platform Baseline v2 révélait trois invariants manquants pour
NestJS et sept pour Spring. Les principaux écarts concernaient l’arrêt gracieux,
les points d’extension Auth/Authorization/Files/Events, la sécurité et
l’observabilité. Des probes fondées sur un nom de fichier ne prouvaient pas les
comportements attendus.

## Alternatives

1. Ajouter FastAPI avant convergence des APIs existantes.
2. Considérer les mécanismes natifs des frameworks comme des preuves implicites.
3. Introduire un second moteur de conformité spécialisé API.
4. Converger les deux adapters dans le moteur existant avec contrats et tests
   idiomatiques.

## Choix

L’alternative 4 est retenue :

- contrat d’extension `api-extension/2.0.0` dans chaque runtime ;
- registre strict, sans provider métier implicite ;
- lifecycle explicite et arrêt gracieux ;
- sécurité HTTP testée ;
- propagation W3C, métriques bornées et hook `telemetry/2.0.0` ;
- source de preuve `behavioral-test` dans le rapport calculé lorsque
  l’implémentation et son contrat de test sont présents ;
- aucun nouveau pipeline de conformité.

## Justification

La parité recherchée est contractuelle et comportementale, pas une duplication
de bibliothèques. NestJS utilise Pino et un service de télémétrie natif ; Spring
utilise SLF4J/MDC et Micrometer. Les deux fournissent néanmoins les mêmes garanties
et points de branchement.

## Conséquences

- les signaux de terminaison ferment les ressources et hooks ;
- une capability incompatible échoue rapidement ;
- l’absence d’une capability reste observable comme absence de provider ;
- les traces sont propagées sans imposer de backend ;
- les métriques évitent les labels à forte cardinalité ;
- NestJS et Spring n’ont plus d’invariant `MISSING` dans le scan Common/API v2 ;
- des invariants restent `PARTIAL`, donc aucun runtime n’est encore déclaré
  `CONFORMANT`.

## Risques

- le hook OpenTelemetry ne prouve pas encore un exporter/back-end réel ;
- les rapports structurels reconnaissent un contrat de test, tandis que son
  exécution reste la responsabilité des quality gates ;
- les ports persistence/transaction et les diagnostics restent incomplets ;
- une capability doit adapter ses overlays aux nouveaux registres versionnés.

## Migration

Les adapters de capabilities enregistrent exactement un provider par point et
déclarent `api-extension/2.0.0`. Les déploiements conservent leurs backends de
télémétrie et fournissent un adapter `telemetry/2.0.0`.

## Tests

- tests de registre et de rejet de versions ;
- tests de transitions et d’idempotence du lifecycle ;
- tests des en-têtes de sécurité/CORS ;
- tests de continuation et régénération W3C ;
- tests de métriques et de hook exporter ;
- suite Common/API unique du moteur de conformité ;
- builds TypeScript et Maven.

## Rollback

Revenir à ADR-058 restaure les probes structurelles et les rapports d’écarts
antérieurs. Aucun format Blueprint ou GenerationPlan n’est modifié par ADR-059.
