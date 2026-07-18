# AI_CORE_V1_READINESS_REVIEW.md

## 1. Verdict

**Décision : `IMPLEMENTATION_PARTIELLE` → `IMPLEMENTATION_AVANCEE`.**

AI Core ne passe pas à `VALIDE_V1`.

La revue confirme que le seuil technique minimal de `CORE_SPECIFICATION.md` §18 est maintenant couvert par
des preuves locales, pures et testées. En revanche, plusieurs critères du futur §19 restent incomplets :
exécution gouvernée de prompts, retrieval source citation, runbook d'usage complet et preuve de non-fuite
sur snapshots de rapports.

## 2. Documents lus

- `strategy/10_AI_STRATEGY.md` ;
- `factory/quality/core/AI_PROMPT_GOVERNANCE.md` ;
- `factory/ai/core/CORE_SPECIFICATION.md` §15–§21 ;
- `factory/ai/core/README.md` ;
- `docs/project-status/NEXT_ACTIONS.md` ;
- `docs/project-status/FOUNDATION_CURRENT_STATE.md` ;
- `docs/project-status/IMPLEMENTATION_MATRIX.md` ;
- `docs/project-status/SESSION_HANDOFF.md`.

## 3. Preuves réelles

| Capacité | Preuve | Verdict |
|---|---|---|
| Prompt registry | `prompt-registry.json`, `src/prompt-registry/*`, script validation | ✅ |
| Redaction layer | `src/redaction/*`, tests secrets/PII/JWT/URLs signées/inline `KEY=value` | ✅ |
| Context builder local | `src/context/*`, allow-list + refus `.env`/deps/build | ✅ |
| Provider seam/fake provider | `src/provider/*`, fake déterministe, adapter redige avant provider | ✅ |
| Evaluation harness | `src/evaluation/*`, périmètre/docs/gates/secrets/format | ✅ |
| Retrieval/RAG decision | `AI_CORE7_RETRIEVAL_RAG_DECISION.md` | ✅ |
| Execution report schema | `src/reports/*`, `ai-execution-report/v1`, refus prompts bruts | ✅ |
| Tests automatisés | 6 fichiers `node --test` + validation registry | ✅ |

## 4. Critères §18

| Critère §18 | État |
|---|---|
| registre de prompts typé ou valide | ✅ |
| redaction layer testée | ✅ |
| context builder local | ✅ |
| provider fake | ✅ |
| evaluation harness initial | ✅ |
| rapports d'exécution versionnables | ✅ |
| tests automatisés | ✅ |

Score §18 : **7/7 satisfaits**.

## 5. Critères §19 futurs

| Critère §19 | État | Commentaire |
|---|---|---|
| aucune fuite de secrets dans les tests | ✅ | Tests redaction + reports + provider |
| prompts gouvernés exécutables localement | ⚠️ Partiel | Registry validé, mais pas encore de runner/orchestrateur de prompt |
| provider fake stable | ✅ | Fake provider déterministe |
| redaction obligatoire | ✅ | Provider adapter + reports + context builder |
| RAG local ou retrieval documentaire sans données sensibles | ⚠️ Partiel | Décision V1 + context builder, mais pas de helper de citation retrieval dédié |
| evaluation de périmètre | ✅ | Evaluation harness |
| documentation et runbooks | ⚠️ Partiel | README/spec/status présents ; runbook d'usage AI Core encore absent |
| gates Quality Core adaptés | ✅ | Tests locaux + `quality-gates docs`, pas de CI automatique dédiée |

Score §19 : **5/8 satisfaits + 3/8 partiels + 0 non satisfaits**.

## 6. Réserves bloquantes pour `VALIDE_V1`

| Ref | Réserve | Déblocage recommandé |
|---|---|---|
| B1 | Pas de runner/orchestrateur local de prompt gouverné | AI Core 9 — Prompt execution runner (fake provider only) |
| B2 | Retrieval source citation non matérialisé en helper testable | AI Core 10 — Retrieval citation helper |
| B3 | Pas de runbook d'usage AI Core complet | AI Core 11 — AI Core usage runbook |

Ces réserves ne bloquent pas `IMPLEMENTATION_AVANCEE`, mais bloquent `VALIDE_V1`.

## 7. Limites maintenues

- Aucun provider réel.
- Aucun SDK IA.
- Aucune clé API.
- Aucun appel réseau.
- Aucun embedding model.
- Aucune base vectorielle.
- Aucun service RAG déployé.
- Aucun stockage de traces.
- Aucun workflow CI automatique.
- Aucune donnée client/projet dérivé dans un corpus IA.

## 8. Vérifications

- `node --test factory/ai/core/test/report-schema.test.mjs factory/ai/core/test/evaluation-harness.test.mjs factory/ai/core/test/provider.test.mjs factory/ai/core/test/context-builder.test.mjs factory/ai/core/test/redaction.test.mjs factory/ai/core/test/prompt-registry.test.mjs` ✅
- `node factory/ai/core/scripts/validate-prompt-registry.mjs` ✅
- `node factory/quality/core/scripts/quality-gates.mjs run docs` ✅
- `git diff --check` ✅

## 9. Prochaine action

**AI Core 9 — Prompt execution runner (fake provider only)**.

Objectif : rendre un prompt gouverné exécutable localement via registry + context builder + redaction +
safe provider adapter + fake provider + execution report schema, sans provider réel, réseau, SDK IA, clé,
stockage externe ou workflow CI automatique.
