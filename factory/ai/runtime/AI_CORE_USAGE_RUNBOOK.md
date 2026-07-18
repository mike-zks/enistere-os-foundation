# AI_CORE_USAGE_RUNBOOK.md

## 1. Objectif

Ce runbook explique comment utiliser Factory AI dans Enistere OS Foundation.

Il couvre uniquement l'usage local, gouverné et testable des briques existantes :

- Prompt Registry ;
- Redaction Layer ;
- Context Builder ;
- Provider Seam + Fake Provider ;
- Evaluation Harness ;
- Execution Reports ;
- Prompt Runner ;
- Retrieval Source Citations.

Il ne crée aucun provider réel, SDK IA, endpoint, service RAG, embedding, base vectorielle, workflow CI
automatique ou stockage de traces.

## 2. Principes obligatoires

```txt
L'IA assiste.
L'humain décide.
Le contexte est allow-listé.
Les secrets sont exclus.
Les sorties sont évaluées.
Les rapports sont relus avant merge.
```

Une exécution Factory AI n'autorise jamais :

- un accès production ;
- une décision d'architecture structurante sans revue ;
- une dépendance provider/SDK/vector DB ;
- une ingestion globale du dépôt ;
- une donnée client/projet dérivé ;
- un contournement de protection `main` ;
- un merge sans CI verte.

## 3. Responsabilités

| Rôle | Responsabilité |
|---|---|
| Pilote / architecte | Choisir la mission, vérifier stratégie/spec/ADR, limiter le périmètre, relire le rapport |
| Agent exécuteur | Utiliser uniquement les fichiers allow-listés, exécuter les gates, produire un rapport factuel |
| Agent reviewer | Chercher bugs, fuites, hors périmètre, gates manquants, incohérences de statut |
| Mainteneur humain | Valider PR, décisions structurantes, releases, tags, accès externes et déploiements |

## 4. Quand utiliser Factory AI

Factory AI est adapté pour :

- cadrer un prompt versionné ;
- construire un contexte documentaire minimal ;
- exécuter une simulation locale via fake provider ;
- vérifier qu'une sortie respecte périmètre, gates et format ;
- citer les sources documentaires incluses ;
- produire un rapport d'exécution sans prompt brut.

Factory AI n'est pas adapté pour :

- générer automatiquement du code en production ;
- connecter un LLM réel ;
- faire du RAG runtime ;
- stocker des prompts, traces ou embeddings ;
- remplacer une revue humaine ;
- traiter des données client.

## 5. Préparation d'une mission

Avant toute exécution :

1. Lire les documents de statut :
   - `docs/project-status/NEXT_ACTIONS.md`
   - `docs/project-status/FOUNDATION_CURRENT_STATE.md`
   - `docs/project-status/IMPLEMENTATION_MATRIX.md`
   - `docs/project-status/SESSION_HANDOFF.md`
2. Lire les documents du core concerné :
   - `starters/<starter>/STARTER_SPECIFICATION.md`
   - `starters/<starter>/README.md`
3. Lire les documents transverses :
   - `strategy/10_AI_STRATEGY.md`
   - `factory/quality/AI_PROMPT_GOVERNANCE.md`
   - `strategy/07_SECURITY.md` si sécurité, auth, logs, cloud, secrets ou données sensibles
4. Choisir un prompt existant dans `factory/ai/runtime/prompt-registry.json`.
5. Vérifier que les fichiers nécessaires sont dans `requiredDocuments` ou `allowedFiles`.

## 6. Validation du registry

Commande obligatoire avant usage d'un prompt :

```bash
node factory/ai/runtime/scripts/validate-prompt-registry.mjs
```

Résultat attendu :

```txt
Prompt registry validation passed (8 prompts).
```

Si cette commande échoue, arrêter la mission et corriger le registry ou les références avant toute exécution.

## 7. Construction du contexte

Le contexte doit être construit uniquement depuis une allow-list explicite.

Module :

```js
import { buildContext } from './src/context/index.mjs';
```

Règles :

- inclure uniquement les fichiers nécessaires ;
- ne jamais inclure `.env`, secrets, `node_modules`, `dist`, `build`, `.git` ;
- ne jamais utiliser `..` ou chemins absolus ;
- accepter la sur-redaction ;
- arrêter si `missingFiles` ou `skippedFiles` signale un contexte incomplet pour la mission.

## 8. Exécution locale d'un prompt

Module :

```js
import { runPromptExecution } from './src/runner/index.mjs';
```

Usage attendu :

1. fournir `repoRoot` ;
2. fournir le registry validé ;
3. fournir `promptId` et idéalement `promptVersion` ;
4. fournir un input borné, non secret ;
5. laisser le runner utiliser le fake provider par défaut ;
6. relire `result.report`, `result.evaluation`, `result.context` et `result.completion.safety`.

Le runner :

- refuse un prompt non `active` ;
- refuse un contexte incomplet ;
- redige input et contexte avant provider ;
- utilise `createSafeProviderAdapter(createFakeProvider())` par défaut ;
- produit un rapport `ai-execution-report/v1`.

Interdits :

- injecter un provider réel ;
- passer une clé API ;
- contourner les erreurs `context_invalid` ;
- persister le prompt brut ;
- présenter la completion fake comme une vérité métier.

## 9. Citations retrieval

Module :

```js
import {
  createCitationsFromContext,
  formatRetrievalCitation,
} from './src/retrieval/index.mjs';
```

Usage attendu :

1. partir de `context.includedFiles` ;
2. produire des citations bornées ;
3. afficher ou reporter uniquement `id`, `path`, `section`, `lines` si disponibles ;
4. ne jamais utiliser l'extrait comme log ;
5. relire `skippedSources` et `redactedKinds`.

Le helper ne recherche rien. Il matérialise seulement les fichiers déjà inclus par le Context Builder.

## 10. Évaluation

Module :

```js
import { evaluateAiOutput } from './src/evaluation/index.mjs';
```

Contrôles à vérifier :

- fichiers modifiés dans le périmètre ;
- fichiers interdits absents ;
- documents requis mentionnés ;
- gates attendus reportés ;
- format minimal du rapport ;
- preuve de vérification ;
- absence de données sensibles détectables.

Une évaluation `warn` ou `fail` doit être traitée avant merge. Une évaluation `pass` ne remplace pas la revue
humaine.

## 11. Rapport d'exécution

Module :

```js
import {
  createExecutionReport,
  validateExecutionReport,
} from './src/reports/index.mjs';
```

Le rapport doit contenir :

- mission ;
- prompt id/version/role ;
- documents lus ;
- fichiers modifiés ;
- gates ;
- limites ;
- évaluation ;
- prochaine action.

Le rapport ne doit jamais contenir :

- `promptText` ;
- `rawPrompt` ;
- `fullPrompt` ;
- `messages` ;
- secret ;
- token ;
- URL signée ;
- donnée client.

## 12. Gates minimaux

Pour une mission Factory AI runtime-local :

```bash
node --test factory/ai/runtime/test/retrieval-citations.test.mjs factory/ai/runtime/test/prompt-runner.test.mjs factory/ai/runtime/test/report-schema.test.mjs factory/ai/runtime/test/evaluation-harness.test.mjs factory/ai/runtime/test/provider.test.mjs factory/ai/runtime/test/context-builder.test.mjs factory/ai/runtime/test/redaction.test.mjs factory/ai/runtime/test/prompt-registry.test.mjs
node factory/ai/runtime/scripts/validate-prompt-registry.mjs
node factory/quality/scripts/quality-gates.mjs run docs
git diff --check
```

Pour une mission docs-only Factory AI :

```bash
node factory/quality/scripts/quality-gates.mjs run docs
git diff --check
```

La CI GitHub reste obligatoire avant merge.

## 13. Rapport final attendu

Le rapport final doit contenir :

- branche ;
- commit ;
- PR ;
- fichiers modifiés ;
- confirmation hors périmètre ;
- architecture ou décision retenue ;
- dépendances ajoutées ou absence ;
- tests et checks exécutés ;
- limites connues ;
- prochaine mission unique recommandée.

Il doit mentionner explicitement tout test non exécuté, environnement manquant ou blocage.

## 14. Checklist avant usage IA

- [ ] Mission et objectif clairs.
- [ ] Prompt existant ou ajouté au registry.
- [ ] Documents obligatoires lus.
- [ ] Fichiers de contexte allow-listés.
- [ ] Secrets exclus.
- [ ] Aucun provider réel requis.
- [ ] Gates identifiés.
- [ ] Revue humaine prévue.

## 15. Checklist après usage IA

- [ ] Registry validé.
- [ ] Tests Factory AI passés.
- [ ] `quality-gates docs` passé.
- [ ] `git diff --check` passé.
- [ ] Rapport d'exécution sans prompt brut.
- [ ] Citations de sources présentes si retrieval utilisé.
- [ ] Évaluation relue.
- [ ] PR créée et CI verte avant merge.

## 16. Escalades obligatoires

Créer une mission/ADR séparé avant :

- provider réel ;
- SDK OpenAI/Anthropic/Gemini/local LLM ;
- embedding model ;
- vector DB ;
- service RAG déployé ;
- stockage d'index ;
- traces persistées ;
- données client/projet dérivé ;
- coûts/quotas IA ;
- workflow CI automatique d'évaluation IA.

## 17. Prochaine étape après ce runbook

Ce runbook ferme B3 de la revue Factory AI V1.

La prochaine action naturelle est une **Factory AI V1 Final Readiness Decision** pour vérifier si B1, B2 et B3
sont bien fermés et si `ai-core` peut passer de `IMPLEMENTATION_AVANCEE` à `VALIDE_V1`.
