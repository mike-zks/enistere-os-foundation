# Chaîne d'exécution

## Projet dérivé

1. Cadrer utilisateurs, parcours, données et contraintes.
2. Produire et valider le blueprint.
3. Exécuter `enistere plan` et examiner capabilities, dépendances et limites.
4. Exécuter `enistere generate` dans un répertoire neuf.
5. Installer sans lien local et exécuter `enistere verify`.
6. Démarrer les runtimes requis.
7. Versionner le projet dérivé et son `enistere.lock`.

## Mission IA

1. L'architecte prépare une mission bornée depuis strategy, ADR, manifests et code réel.
2. L'humain approuve le plan.
3. L'agent travaille dans un worktree dédié.
4. Les gates adaptés au périmètre sont exécutés.
5. L'architecte revoit le diff et les preuves.
6. L'humain approuve l'application et le merge.

## Arrêt obligatoire

Secret détecté, dépendance structurante non autorisée, target non `ready`, changement hors périmètre,
gate rouge ou contradiction avec un ADR.
