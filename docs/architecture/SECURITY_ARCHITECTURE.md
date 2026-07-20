# Architecture de sécurité

## Principes

- secure by default ;
- least privilege ;
- deny by default ;
- defense in depth ;
- secrets isolation ;
- auditable changes ;
- verified supply chain.

## Factory

- validation des entrées ;
- isolation des agents ;
- worktrees temporaires ;
- commandes contrôlées ;
- double approbation ;
- aucun merge ou déploiement implicite.

## Composants

- dépendances analysées ;
- artefacts signés ;
- checksums ;
- SBOM ;
- aucun secret dans les templates.

## Projets dérivés

- authentification et autorisation conformes ;
- validation des entrées ;
- secure headers ;
- audit ;
- rotation de clés ;
- sauvegarde et restauration ;
- gestion des vulnérabilités.

## Gates

- secret scan ;
- SAST ;
- dependency scan ;
- container scan ;
- licence scan ;
- security contract tests ;
- SBOM ;
- provenance.

## Données

- classification ;
- minimisation ;
- chiffrement en transit ;
- chiffrement au repos lorsque requis ;
- rétention ;
- suppression ;
- isolation tenant.
