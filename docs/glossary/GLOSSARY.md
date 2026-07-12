# Glossary

> Docs Core 3.
> Derniere mise a jour : 2026-07-12.

Ce glossaire definit les termes utilises dans les statuts, rapports, missions et PR du repository.

## Statuts de core

| Terme | Definition |
|---|---|
| `ABSENT` | Aucun dossier ou fichier exploitable n'existe. |
| `DOSSIER_SEULEMENT` | Le dossier existe, mais aucun cadrage ou starter utilisable n'est livre. |
| `SPECIFICATION_DOCUMENTAIRE` | Le core dispose d'une specification/README, sans runtime ou implementation substantielle. |
| `CADRAGE_OPERATIONNEL` | Des documents de politique, runbooks ou procedures existent, sans infrastructure ou runtime complet. |
| `IMPLEMENTATION_PARTIELLE` | Une partie utilisable existe, mais le perimetre V1/V2 vise n'est pas complet. |
| `IMPLEMENTATION_AVANCEE` | Le core est largement utilisable, avec tests/preuves, mais pas encore declare V1 complet. |
| `VALIDE_V1` | Les criteres V1 du core sont satisfaits, revus et documentes. |
| `SUSPENDU` | Le travail est volontairement pause, souvent faute de prerequis externe. |
| `A_REVOIR` | Le statut ou les preuves sont incoherents et doivent etre reaudites. |

## Concepts de livraison

| Terme | Definition |
|---|---|
| Merge | Integration technique d'une PR dans `main`. |
| Release | Publication gouvernee d'un etat de la Foundation, avec notes et tag si applicable. |
| Promotion de statut | Changement documente du statut d'un core apres revue et preuves. |
| Gate | Verification locale ou CI requise avant merge/release. |
| Link check | Controle local des liens Markdown internes de la documentation centrale. |
| Guide principal | Document durable expliquant une pratique transversale, par exemple maintenance documentaire ou revue de statut. |
| Hors perimetre | Ce qu'une mission ne doit pas modifier, meme si c'est proche du sujet. |
| Preuve | Test, build, rapport runtime, CI ou fichier concret qui soutient une affirmation. |

## Cores principaux

| Terme | Definition |
|---|---|
| API Core | Socle backend NestJS, contrats OpenAPI, auth, RBAC, files, logging. |
| Web Core | Socle Next.js BFF/UI/session/files, consommateur API et UI Kit. |
| Mobile Core | Socle React Native/Expo, auth/session, primitives transverses et starter runtime. |
| UI Kit | Design tokens et primitives UI reutilisables. |
| Cloud Core | CI, registry, staging, runbooks operationnels et deploiement gouverne. |
| Quality Core | Gates, checklists, templates, release process et gouvernance qualite. |
| Docs Core | Index, navigation documentaire, onboarding, glossaire et dette documentaire. |

## Securite et donnees

| Terme | Definition |
|---|---|
| Secret | Valeur sensible non versionnable : token, mot de passe, cle privee, `.env` reel. |
| URL signee | URL temporaire donnant acces a une ressource ; ne doit pas etre loggee ni stockee durablement. |
| PII | Donnee personnelle identifiable. |
| CSRF | Protection contre les requetes forgees cote navigateur. |
| RBAC | Controle d'acces par roles et permissions. |
| BFF | Backend-for-Frontend, route serveur ciblee entre navigateur et API. |

## Qualite et CI

| Terme | Definition |
|---|---|
| L1 | Non-regression monorepo sans service externe durable. |
| L2 | Validation runtime API avec PostgreSQL/MinIO jetables. |
| L3 | E2E navigateur Web sur stack reelle jetable. |
| L4 | Registry/images, smoke image, publication GHCR selon scope. |
| `all-safe` | Scope Quality Core local combinant packages, UI Kit, Web et audit racine, sans Cloud/device. |
| Smoke | Verification courte qu'un runtime demarre et repond comme attendu. |

## Documents

| Terme | Definition |
|---|---|
| ADR | Architecture Decision Record : decision d'architecture versionnee. |
| `project-status` | Dossier source de pilotage operationnelle. |
| `SESSION_HANDOFF` | Resume compact pour reprendre une session. |
| `NEXT_ACTIONS` | Prochaine action autorisee et historique de pilotage. |
| `IMPLEMENTATION_MATRIX` | Matrice officielle des statuts par core/package/module. |
| `FOUNDATION_CURRENT_STATE` | Photographie officielle de l'etat courant. |
