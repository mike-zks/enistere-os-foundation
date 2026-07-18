# Prompt — Génération de STARTER_SPECIFICATION.md

## Rôle attendu

Tu es un assistant IA chargé de générer une spécification de starter pour Enistere OS Foundation. Tu ne dois générer aucun code applicatif.

## Contexte

La spécification doit être alignée avec :

- `strategy/01_VISION_FINAL.md`
- `strategy/02_GOVERNANCE.md`
- `strategy/03_ARCHITECTURE_TARGET.md`
- `strategy/04_ROADMAP_GLOBAL.md`
- `strategy/05_EXECUTION_CHAIN.md`
- `strategy/06_DEPENDENCY_STRATEGY.md`
- `strategy/07_SECURITY.md`
- `strategy/08_STANDARDS.md`
- `strategy/10_AI_STRATEGY.md`

## Objectif

Produire le contenu d'un fichier `STARTER_SPECIFICATION.md` pour un seul starter.

## Entrées à fournir

- Nom du starter :
- Dossier cible :
- Statut :
- Priorité roadmap :
- Technologies ciblées :
- Contraintes spécifiques :

## Périmètre autorisé

Créer ou proposer uniquement le contenu du `STARTER_SPECIFICATION.md` demandé.

## Hors périmètre

- Ne génère aucun code applicatif.
- Ne crée aucun projet framework.
- Ne crée aucune dépendance.
- Ne crée aucun fichier autre que le `STARTER_SPECIFICATION.md` demandé.
- Ne modifie pas la vision, l'architecture cible, la roadmap, la sécurité ou la stratégie IA.

## Structure attendue

La spécification doit contenir :

1. Identité du starter.
2. Rôle du starter.
3. Objectifs.
4. Périmètre inclus.
5. Hors périmètre.
6. Modules ou capacités prévues.
7. Responsabilités principales.
8. Interactions avec les autres starters et packages.
9. Dépendances potentielles et règles d'évaluation.
10. Sécurité.
11. Tests et vérifications.
12. Documentation attendue.
13. Roadmap indicative.
14. Critères d'acceptation.
15. Risques et points de vigilance.

## Contraintes

- Rédiger en français clair.
- Rester générique et réutilisable.
- Ne pas inclure de logique métier spécifique à un projet dérivé.
- Mentionner les dépendances comme candidates ou potentielles, jamais comme installées.
- Signaler les décisions qui nécessitent un ADR.
- Rappeler que l'IA assiste mais ne valide pas seule.

## Format de réponse attendu

Fournir :

- contenu complet du `STARTER_SPECIFICATION.md` ;
- hypothèses retenues ;
- points à valider humainement ;
- risques identifiés ;
- prochaines étapes recommandées.

