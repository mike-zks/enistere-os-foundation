# AI_CORE10_RETRIEVAL_CITATIONS_REPORT.md

## 1. Verdict

**AI Core 10 — Retrieval source citation helper : RÉALISÉ.**

B2 de la revue `AI_CORE_V1_READINESS_REVIEW.md` est fermé : les sources documentaires incluses dans un
contexte peuvent maintenant être matérialisées en citations bornées, sûres et testables.

`ai-core` reste **`IMPLEMENTATION_AVANCEE`**. `VALIDE_V1` reste différé par une seule réserve :

- B3 — runbook d'usage AI Core.

## 2. Livrables

- `factory/ai/core/src/retrieval/source-citations.mjs` : helpers purs de citation.
- `factory/ai/core/src/retrieval/index.mjs` : exports publics.
- `factory/ai/core/test/retrieval-citations.test.mjs` : tests Node purs.

## 3. Architecture

Le module ne fait pas de recherche. Il transforme seulement des sources déjà allow-listées et incluses dans
le contexte en citations :

- `normalizeRetrievalSource()` : normalise un chemin sûr, titre, section, lignes, commit, score et extrait ;
- `createRetrievalCitations()` : produit une liste bornée de citations, déduplique les sources et signale les
  chemins refusés ;
- `createCitationsFromContext()` : consomme la sortie `includedFiles` du Context Builder ;
- `formatRetrievalCitation()` : formate une référence courte `[S1] path # section lines x-y` sans extrait ;
- `describeRetrievalCitationsForLog()` : retourne uniquement des compteurs sûrs.

## 4. Sécurité

Maintenu explicitement :

- aucun RAG runtime ;
- aucun embedding ;
- aucune base vectorielle ;
- aucun provider réel ;
- aucun SDK IA ;
- aucun appel réseau ;
- aucune lecture disque dans ce module ;
- aucun stockage d'index ou de trace ;
- aucune donnée client/projet dérivé.

Les extraits éventuels passent par la redaction AI Core 3. Les chemins non sûrs (`.env`, `..`, chemins
absolus, artefacts interdits) sont ignorés avec raison contrôlée.

## 5. Tests

`retrieval-citations.test.mjs` couvre :

- normalisation d'une source sûre ;
- redaction d'extraits sensibles ;
- refus des chemins dangereux ;
- déduplication ;
- bornes de nombre de citations ;
- création depuis `buildContext().includedFiles` ;
- formatage sans fuite d'extrait ;
- description de log par compteurs uniquement.

## 6. Prochaine action

**AI Core 11 — AI Core usage runbook.**

Objectif : documenter quand et comment utiliser registry, context builder, runner, citations, evaluation et
reports, avec interdits, gates, responsabilités humaines et exemples de commandes, sans provider réel ni
workflow CI automatique.
