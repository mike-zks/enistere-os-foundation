# Factory AI Runtime Specification

## Objectif

Fournir les primitives sûres utilisées par l'orchestration locale des agents : registre de prompts,
construction de contexte, redaction, provider seam, rapports et évaluation déterministe.

## Contrats

- contexte construit par allow-list avec limites de taille ;
- redaction avant toute sortie vers un provider ou un sink ;
- prompts identifiés, versionnés et validés ;
- provider abstrait, fake provider déterministe pour les tests ;
- rapport structuré sans secret ;
- citations limitées aux sources réellement incluses.

## Limites

Le runtime ne choisit pas l'architecture, ne contient aucun SDK fournisseur, ne stocke aucune clé, ne
déclenche aucun merge et ne remplace pas les approbations de l'orchestration Factory.

## Validation

Les tests sous `test/` couvrent registre, redaction, contexte, provider, runner, rapports, citations et
evaluation harness. Toute extension doit conserver un mode entièrement local et déterministe.
