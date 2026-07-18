# AI_CORE11_USAGE_RUNBOOK_REPORT.md

## 1. Verdict

**AI Core 11 — AI Core usage runbook : RÉALISÉ.**

B3 de la revue `AI_CORE_V1_READINESS_REVIEW.md` est fermé : AI Core dispose maintenant d'un runbook
d'usage complet pour registry, context builder, runner, citations, evaluation, reports, gates et
responsabilités humaines.

`ai-core` reste **`IMPLEMENTATION_AVANCEE`** jusqu'à une décision finale dédiée.

## 2. Livrable

- `factory/ai/core/AI_CORE_USAGE_RUNBOOK.md`

## 3. Contenu couvert

Le runbook documente :

- objectif et limites AI Core ;
- principes obligatoires ;
- responsabilités par rôle ;
- cas d'usage autorisés et interdits ;
- préparation d'une mission ;
- validation du registry ;
- construction du contexte ;
- exécution locale d'un prompt via fake provider ;
- citations retrieval ;
- evaluation ;
- rapport d'exécution ;
- gates minimaux ;
- rapport final attendu ;
- checklists avant/après usage IA ;
- escalades obligatoires.

## 4. Sécurité

Maintenu explicitement :

- aucun provider réel ;
- aucun SDK IA ;
- aucune clé API ;
- aucun appel réseau ;
- aucun RAG runtime ;
- aucun embedding ;
- aucune base vectorielle ;
- aucun endpoint ;
- aucun workflow CI automatique ;
- aucun stockage de traces ;
- aucune donnée client/projet dérivé.

## 5. Impact statut

B1, B2 et B3 sont désormais fermés :

- B1 — prompt runner gouverné : AI Core 9 ;
- B2 — retrieval source citation helper : AI Core 10 ;
- B3 — runbook d'usage AI Core : AI Core 11.

La prochaine action naturelle est une **AI Core V1 Final Readiness Decision** pour décider si `ai-core`
peut passer de `IMPLEMENTATION_AVANCEE` à `VALIDE_V1`.
