# Architecture de référence IA

## 1. Deux plans distincts

```text
AI for the Factory                    AI in Derived Systems
──────────────────                    ─────────────────────
Requirements Analyzer                FastAPI AI runtime/services
Architecture Advisor                 Model/provider adapters
Blueprint Generator                  RAG
Code Generation Assistant            Domain agents
Review/Security/Migration Agents      Inference
Documentation/Operations Agents       AI observability
Evaluation Engine                    Product-specific policies
```

L'IA de la Factory n'est pas une capability d'un système dérivé. Une charge IA dérivée est déclarée comme
application/runtime/service et capabilities métier appropriées.

## 2. IA de la Factory

### Flux

```text
Input → Context Policy → Analyzer → Proposal → Deterministic Validation
→ Human Approval → Sandboxed Action → Verification → Evidence
```

Les agents peuvent analyser les besoins, recommander un profil, produire un blueprint, assister la
génération, réviser, analyser la sécurité, préparer une migration, documenter et diagnostiquer
l'exploitation.

Le resolver, les schémas, policies et conformance gates restent autoritaires. Une sortie de modèle non
validée est une proposition.

### Contrats

Chaque tâche IA déclare objectif, entrées autorisées, outils, budget, données interdites, schéma de sortie,
approbations, évaluations et stratégie d'échec. Les prompts et modèles sont versionnés ; provider/model,
paramètres et digests sont traçables.

## 3. IA des projets dérivés

Une application `kind: api`, `runtime: fastapi` peut héberger un service IA, mais FastAPI n'implique pas
automatiquement l'IA. Une application IA déclare :

- modèle(s), providers et régions ;
- classification et rétention des données ;
- RAG : sources, ingestion, index, citations et freshness ;
- agents : outils, permissions, budgets et mémoire ;
- inference : sync/async, streaming, quotas et fallback ;
- évaluations, sécurité et observabilité IA ;
- ownership, SLO, coûts et stratégie de dégradation.

## 4. Garde-fous

L'IA NE PEUT PAS seule :

- adopter une architecture ou modifier une spécification normative ;
- pousser, fusionner, publier ou déclarer `PRODUCTION_READY` ;
- appliquer une suppression destructive ou migration irréversible ;
- obtenir un secret brut non requis ;
- contourner validation, policy, tests ou approbation.

Les tools appliquent least privilege, allowlists de chemins/actions, isolation, limites de ressources et
timeouts. Les données sensibles sont minimisées, redacted et soumises à résidence/rétention.

## 5. Approbations

| Action | Approbation |
|---|---|
| analyse/recommandation sans mutation | aucune ou revue a posteriori selon policy |
| création de plan/diff dans workspace | policy de mission |
| application de code/config | approbation humaine ou policy explicite réversible |
| migration destructive, publication, prod | approbation humaine obligatoire et séparée |

Le système conserve qui a demandé, proposé, approuvé, exécuté et vérifié.

## 6. Preuves et évaluation

Les preuves comprennent contexte autorisé, prompt/version, modèle/provider, tool calls, sorties structurées,
diff, approbations, tests, policy decisions, coûts/latence et résultat. Les contenus sensibles sont
référencés ou hachés plutôt que recopiés.

L'Evaluation Engine mesure exactitude de schéma, groundedness/citations, sécurité, refus, régression,
qualité de blueprint, compilation, tests, coût et latence. Les changements de modèle ou prompt passent une
suite de régression avant promotion.

## 7. Observabilité IA

Les traces IA corrèlent requête produit, appels de modèle, retrieval, tools et résultat, sans enregistrer
les prompts sensibles par défaut. Métriques minimales : latence, tokens/coût, erreurs, refus, cache,
fallback, qualité d'évaluation et incidents de policy.

## 8. Résilience

Timeouts, quotas, circuit breakers, fallback contrôlé, mode dégradé sans IA, idempotence des tools et
human handoff sont explicités. Un agent ne boucle jamais sans budget borné.

## 9. Statut actuel

Le dépôt contient des actifs d'orchestration locale et de gouvernance, mais aucune plateforme IA complète
ni runtime FastAPI générable n'est revendiqué. Leur qualification est détaillée dans
[l'audit cible/existant](../audits/TARGET_VS_CURRENT_IMPLEMENTATION.md).
