# Gouvernance IA et architecture des agents

La cible complète est définie dans
[AI_REFERENCE_ARCHITECTURE.md](AI_REFERENCE_ARCHITECTURE.md). Ce document résume les règles de gouvernance.

## Deux périmètres

- **IA de la Factory :** analyse, recommandation, blueprint, assistance de développement, revue, sécurité,
  migration, documentation et opérations.
- **IA des projets dérivés :** runtimes/services applicatifs, modèles/providers, RAG, agents métier,
  inference et observabilité IA.

Ces périmètres ne partagent ni autorité implicite, ni données, ni statut.

## Autorité

L'IA propose. Les schémas, resolver, policies, tests, approbations humaines et Conformance Reports
décident. Un agent ne peut seul modifier une spécification, fusionner, publier, appliquer une action
destructive, approuver une migration irréversible ou déclarer la production readiness.

## Exécution

Chaque mission déclare objectif, contexte autorisé, tools, budget, schéma de sortie, données interdites,
approbations et évaluations. L'exécution est isolée, bornée, least-privilege et traçable. Les providers sont
interchangeables.

## Preuves

Sont conservés sous politique : contexte, versions prompt/modèle/provider, plan, tool calls, diff,
approbations, tests, évaluations, coûts/latence et décision. Secrets et données sensibles sont redacted ou
référencés.

## Sécurité

- pas de push/release automatique ;
- approbation séparée pour action prod ou irréversible ;
- chemins/actions allowlisted ;
- protection contre prompt injection et exfiltration ;
- limites de ressources, tools et boucles ;
- évaluations sécurité/régression avant promotion ;
- mode dégradé et human handoff.
