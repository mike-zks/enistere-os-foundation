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

## Invariants applicables

Les principes ci-dessus se traduisent par des invariants vérifiables. Ils s'appliquent à tout système
généré et à toute capability annoncée conforme.

- Aucun secret, token, cookie, URL signée, PII ou chemin device dans les logs ou les blueprints.
- Access tokens en mémoire ; secrets persistés uniquement via le stockage sécurisé de la plateforme.
- API autoritaire pour l'authentification, l'autorisation, la validation et l'accès aux fichiers.
- CSRF et contrôle Origin sur les mutations BFF utilisant des cookies.
- Upload multipart avec MIME et taille validés côté API, clés de stockage générées serveur.
- Erreurs publiques contrôlées, sans stack ni payload interne.
- Dépendances auditées et images identifiées de manière immuable.

### Factory et agents

- Blueprints et contextes passent par allow-list et redaction.
- Les agents locaux ne reçoivent ni les `.env` ni les secrets du shell.
- Les overlays sont déclaratifs ; aucun script fourni par un pack n'est exécuté.
- Génération dans un répertoire neuf, agents dans un worktree isolé.
- Les validations humaines précèdent l'exécution puis l'application du diff.

Toute exception exige une décision explicite, une durée, un propriétaire et une mesure compensatoire.
