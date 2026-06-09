# Enistere OS Foundation — Master Context IA

## Rôle de ce contexte

Tu travailles sur **Enistere OS Foundation**, une plateforme interne d'ingénierie logicielle destinée à standardiser la création de projets mobiles, web, API backend, cloud, UI Kit, documentation, qualité et IA.

Ce contexte doit être fourni à Codex, Claude Code ou tout autre agent IA avant toute mission de génération, revue, documentation ou validation.

## Cores de la fondation

La fondation cible les cores suivants :

- `mobile-react-native` : socle mobile React Native / Expo.
- `mobile-flutter` : socle mobile Flutter.
- `web-nextjs` : socle web Next.js.
- `web-angular` : socle web Angular.
- `api-nestjs` : socle API NestJS.
- `api-spring` : socle API Spring Boot.
- `cloud` : socle infrastructure, déploiement et services cloud.
- `ui-kit` : design system et composants UI.
- `ai-core` : prompts, workflows IA et automatisations contrôlées.
- `docs-core` : documentation, guides, ADR, runbooks et onboarding.
- `quality-core` : standards qualité, tests, revues et validation.

## Documents stratégiques de référence

Avant toute modification structurante, respecter :

- `strategy/01_VISION_FINAL.md`
- `strategy/02_GOVERNANCE.md`
- `strategy/03_ARCHITECTURE_TARGET.md`
- `strategy/04_ROADMAP_GLOBAL.md`
- `strategy/05_EXECUTION_CHAIN.md`
- `strategy/06_DEPENDENCY_STRATEGY.md`
- `strategy/07_SECURITY.md`
- `strategy/08_STANDARDS.md`
- `strategy/09_GIT_STRATEGY.md`
- `strategy/10_AI_STRATEGY.md`

## Philosophie d'exécution

- L'IA assiste, mais ne décide pas seule.
- La vision, l'architecture, la sécurité et les dépendances structurantes restent sous validation humaine.
- Toute tâche doit avoir un périmètre strict, explicite et limité.
- La documentation et les tests ou vérifications doivent accompagner les changements significatifs.
- Les risques, limites et hypothèses doivent être signalés clairement.

## Règles principales

- Respecter le périmètre autorisé de la mission.
- Ne jamais modifier un fichier hors périmètre.
- Ne jamais générer un core complet sans découpage et validation.
- Ne jamais créer de code applicatif si la mission est documentaire.
- Ne jamais ajouter de dépendance sans justification explicite et validation.
- Ne jamais manipuler, exposer ou inventer de secret.
- Ne jamais documenter une fonctionnalité inexistante comme déjà disponible.
- Ne jamais appliquer une décision structurante sans ADR ou validation humaine.

## Format de réponse attendu pour une mission IA

Répondre avec :

- résumé des changements ;
- fichiers créés ;
- fichiers modifiés ;
- tests ou vérifications réalisés ;
- documentation mise à jour ;
- risques et limites ;
- recommandations ou prochaines étapes.

