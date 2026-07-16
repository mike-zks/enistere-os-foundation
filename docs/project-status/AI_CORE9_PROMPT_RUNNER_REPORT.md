# AI_CORE9_PROMPT_RUNNER_REPORT.md

## 1. Verdict

**AI Core 9 — Prompt execution runner (fake provider only) : RÉALISÉ.**

B1 de la revue `AI_CORE_V1_READINESS_REVIEW.md` est fermé : un prompt gouverné peut maintenant être
exécuté localement via le registry, le context builder allow-list, la redaction, le safe provider adapter,
le fake provider déterministe, l'evaluation harness et le schema de rapport d'exécution.

`ai-core` reste **`IMPLEMENTATION_AVANCEE`**. `VALIDE_V1` reste différé par :

- B2 — retrieval source citation helper ;
- B3 — runbook d'usage AI Core.

## 2. Livrables

- `cores/ai-core/src/runner/prompt-runner.mjs` : runner local gouverné.
- `cores/ai-core/src/runner/index.mjs` : exports publics.
- `cores/ai-core/test/prompt-runner.test.mjs` : tests Node purs.

## 3. Architecture

Le runner compose uniquement les briques déjà gouvernées :

1. résolution d'un prompt `active` dans `prompt-registry.json` ;
2. sélection stricte des fichiers de contexte à partir de `requiredDocuments + allowedFiles` ;
3. construction du contexte via `buildContext()` ;
4. refus avant provider si un document manque ou si un chemin est hors allow-list ;
5. invocation via `createSafeProviderAdapter(createFakeProvider())` par défaut ;
6. évaluation locale via `evaluateAiOutput()` ;
7. création d'un rapport `ai-execution-report/v1` via `createExecutionReport()`.

Le rapport ne contient jamais `promptText`, `rawPrompt`, `fullPrompt` ou `messages`.

## 4. Sécurité

Maintenu explicitement :

- aucun provider réel ;
- aucun SDK IA ;
- aucune clé API ;
- aucun appel réseau ;
- aucun embedding ;
- aucune base vectorielle ;
- aucun service RAG ;
- aucun endpoint ;
- aucun workflow CI automatique ;
- aucun stockage externe ou trace persistée.

Les entrées et le contexte passent par la redaction avant provider. Les erreurs sont contrôlées via
`AiRunnerError` et ne contiennent pas de prompt complet.

## 5. Tests

`prompt-runner.test.mjs` couvre :

- exécution complète d'un prompt actif via fake provider ;
- rapport d'exécution valide ;
- redaction de l'input et du contexte avant sortie ;
- refus d'un fichier de contexte hors allow-list ;
- refus d'un document requis manquant ;
- refus d'un prompt inactif ;
- absence de payload prompt brut dans le rapport.

## 6. Prochaine action

**AI Core 10 — Retrieval source citation helper.**

Objectif : matérialiser des citations de sources documentaires à partir des fichiers inclus dans le
contexte, sans RAG runtime, embedding, vector DB, provider réel, réseau ou stockage d'index.
