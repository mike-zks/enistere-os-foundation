# Conformance Model

## Niveaux

### TARGET
Élément adopté dans l'architecture de référence, sans promesse d'implémentation.

### PLANNED
Élément séquencé avec dépendances, livrables et critères de sortie.

### IMPLEMENTED
Implémentation existante.

### GENERATABLE
Matérialisation possible.

### BOOTABLE
Compilation et démarrage réels.

### CONFORMANT
Suites applicables réussies.

### PRODUCT_EQUIVALENT
Même comportement observable entre adapters alternatifs.

### PRODUCTION_READY
Sécurité, exploitation, migration, performance et release validées.

Les statuts ne sont pas automatiquement cumulatifs : chaque promotion cite des preuves compatibles avec la
version résolue. Représentable ne signifie jamais générable.

## Preuves

- schema tests ;
- unit tests ;
- contract tests ;
- integration tests ;
- golden generation ;
- golden runtime ;
- E2E ;
- security checks ;
- fitness functions ;
- migration tests ;
- rollback tests ;
- performance budgets.

## Matrice unique

Le support est généré depuis une source structurée et les résultats des tests. Aucun Markdown ne promeut manuellement un statut.

Le rapport exécutable courant suit
`factory/schema/conformance-report.schema.json` et sépare `baseline.invariants` de
`familyContract.invariants`.

L'évaluation `structural` peut référencer une source `behavioral-test` lorsqu'elle
trouve simultanément l'implémentation et le scénario de test normatif. Cette mention
identifie la nature de la preuve attendue ; elle ne transforme pas le scan statique
en reçu d'exécution. Seul le quality gate qui exécute effectivement ce scénario peut
promouvoir le runtime vers `CONFORMANT`.
