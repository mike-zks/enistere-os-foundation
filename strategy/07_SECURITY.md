# Stratégie sécurité

## Invariants

- Aucun secret, token, cookie, URL signée, PII ou chemin device dans les logs ou blueprints.
- Access tokens en mémoire ; secrets persistés uniquement via le stockage sécurisé de la plateforme.
- API autoritaire pour authentification, autorisation, validation et accès aux fichiers.
- CSRF et contrôle Origin sur mutations BFF utilisant des cookies.
- Upload multipart avec MIME/taille validés côté API et clés de stockage générées serveur.
- Erreurs publiques contrôlées, sans stack ni payload interne.
- Dépendances auditées et images identifiées de manière immuable.

## Factory et IA

- Blueprints et contextes passent par allow-list et redaction.
- Les agents locaux ne reçoivent pas les `.env` ni les secrets du shell.
- Les overlays sont déclaratifs ; aucun script de pack non approuvé n'est exécuté.
- Génération dans un répertoire neuf et IA dans un worktree isolé.
- Les validations humaines précèdent l'exécution et l'application du diff.

Toute exception exige une décision explicite, une durée, un propriétaire et une mesure compensatoire.
