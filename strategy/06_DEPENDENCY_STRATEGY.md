# Stratégie de dépendances

- Utiliser les versions stables compatibles, vérifiées lors de chaque upgrade planifié.
- Verrouiller les résolutions par lockfile et conserver des installs reproductibles.
- Ajouter une dépendance uniquement si elle réduit un risque ou remplace une implémentation complexe.
- Préférer les bibliothèques officielles et maintenues pour sécurité, protocoles et formats.
- Une capability déclare ses dépendances par target ; la Factory les fusionne sans doublon.
- Aucun projet généré ne dépend de `file:`, `npm link` ou d'un chemin vers la Foundation publiée.
- Les packages Enistere suivent SemVer et sont testés depuis leur artefact distribué.
- Les audits ne sont jamais désactivés pour rendre une CI verte.

Les upgrades majeurs sont traités comme des missions dédiées avec matrice de compatibilité, migration,
tests des starters et preuve sur au moins un golden.
