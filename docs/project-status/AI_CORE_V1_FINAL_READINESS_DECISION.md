# AI_CORE_V1_FINAL_READINESS_DECISION.md

## 1. Verdict

**Décision : `IMPLEMENTATION_AVANCEE` → `VALIDE_V1`.**

AI Core satisfait maintenant les critères V1 de `factory/ai/core/CORE_SPECIFICATION.md` §19. Les trois
réserves bloquantes identifiées lors de la revue du 2026-07-16 sont fermées par AI Core 9, AI Core 10 et
AI Core 11.

La promotion ne change pas le périmètre : AI Core reste un socle local, gouverné et déterministe. Il ne
choisit aucun provider IA réel, ne déploie aucun service IA et ne contacte aucun réseau.

## 2. Documents lus

- `strategy/10_AI_STRATEGY.md` ;
- `factory/quality/core/AI_PROMPT_GOVERNANCE.md` ;
- `factory/ai/core/CORE_SPECIFICATION.md` §15–§22 ;
- `factory/ai/core/README.md` ;
- `factory/ai/core/AI_CORE_USAGE_RUNBOOK.md` ;
- `docs/project-status/AI_CORE_V1_READINESS_REVIEW.md` ;
- `docs/project-status/AI_CORE9_PROMPT_RUNNER_REPORT.md` ;
- `docs/project-status/AI_CORE10_RETRIEVAL_CITATIONS_REPORT.md` ;
- `docs/project-status/AI_CORE11_USAGE_RUNBOOK_REPORT.md` ;
- `docs/project-status/NEXT_ACTIONS.md` ;
- `docs/project-status/FOUNDATION_CURRENT_STATE.md` ;
- `docs/project-status/IMPLEMENTATION_MATRIX.md` ;
- `docs/project-status/SESSION_HANDOFF.md`.

## 3. Preuves réelles

| Capacité | Preuve | Verdict |
|---|---|---|
| Prompt registry | `prompt-registry.json`, `src/prompt-registry/*`, CLI validation | ✅ |
| Redaction layer | `src/redaction/*`, tests secrets/PII/JWT/URLs signées/chemins locaux | ✅ |
| Context builder local | `src/context/*`, allow-list stricte, refus chemins dangereux, bornes | ✅ |
| Provider seam/fake provider | `src/provider/*`, fake déterministe, adapter sûr avec redaction | ✅ |
| Evaluation harness | `src/evaluation/*`, contrôle périmètre/docs/gates/secrets/rapport | ✅ |
| Retrieval/RAG V1 decision | `AI_CORE7_RETRIEVAL_RAG_DECISION.md` | ✅ |
| Execution report schema | `src/reports/*`, schema `ai-execution-report/v1`, pas de prompt brut | ✅ |
| Prompt runner gouverné | `src/runner/*`, registry + context + fake provider + evaluation + report | ✅ |
| Retrieval citations | `src/retrieval/*`, citations sûres depuis contexte déjà allow-listé | ✅ |
| Usage runbook | `factory/ai/core/AI_CORE_USAGE_RUNBOOK.md` | ✅ |
| Tests automatisés | 8 fichiers `node --test` + validation registry | ✅ |

## 4. Critères §19

| Critère §19 | État | Preuve |
|---|---|---|
| aucune fuite de secrets dans les tests | ✅ | redaction, provider, reports, runner, citations |
| prompts gouvernés exécutables localement | ✅ | AI Core 9 `runGovernedPrompt()` fake-provider |
| provider fake stable | ✅ | AI Core 5, fake déterministe + tests |
| redaction obligatoire | ✅ | redaction appliquée avant provider, contexte, rapports et citations |
| RAG local ou retrieval documentaire sans données sensibles | ✅ | décision AI Core 7 + citations AI Core 10 |
| evaluation de périmètre | ✅ | evaluation harness AI Core 6 |
| documentation et runbooks | ✅ | spec, README, rapports, `AI_CORE_USAGE_RUNBOOK.md` |
| gates Quality Core adaptés | ✅ | tests Node locaux + `quality-gates docs`, sans CI IA automatique |

Score §19 : **8/8 satisfaits**.

## 5. Fermeture des réserves

| Ref | Réserve initiale | Fermeture |
|---|---|---|
| B1 | Pas de runner/orchestrateur local de prompt gouverné | ✅ AI Core 9 |
| B2 | Retrieval source citation non matérialisé en helper testable | ✅ AI Core 10 |
| B3 | Pas de runbook d'usage AI Core complet | ✅ AI Core 11 |

Réserves bloquantes restantes : **0**.

## 6. Limites maintenues

Cette décision ne livre pas et ne décide pas :

- provider IA réel ;
- SDK IA ;
- clé API ;
- appel réseau ;
- service IA déployé ;
- LLM judge ;
- embedding model ;
- vector store ;
- RAG runtime ;
- endpoint applicatif ;
- workflow CI automatique d'exécution IA ;
- stockage de traces IA ;
- traitement de données client ou de projet dérivé.

Tout choix de provider, modèle, SDK, embeddings, vector store, stockage de traces, quotas/coûts ou service
RAG persistant reste une décision future dédiée, avec ADR si le choix devient structurant.

## 7. Décision

AI Core passe à **`VALIDE_V1`**.

Justification :

- §18 était déjà 7/7 satisfait ;
- §19 est désormais 8/8 satisfait ;
- B1, B2 et B3 sont fermés ;
- les tests locaux et les gates docs sont reproductibles ;
- les limites de sécurité restent explicites et non contournées ;
- la revue humaine reste obligatoire et AI Core ne remplace pas la gouvernance.

## 8. Vérifications

- `node factory/ai/core/scripts/validate-prompt-registry.mjs`
- `node --test factory/ai/core/test/*.test.mjs`
- `node factory/quality/core/scripts/quality-gates.mjs run docs`
- `git diff --check`

## 9. Prochaine action

Retour au pilotage global. Les prochains incréments AI Core doivent rester post-V1 et faire l'objet d'une
décision dédiée : provider réel, SDK IA, embeddings, vector store, trace storage, RAG runtime ou CI IA
automatique ne sont pas des suites implicites.
