# 09_GIT_STRATEGY.md

# Enistere OS Foundation — Stratégie Git

> **Règle V2 — 2026-07-18** : le monorepo Foundation utilise `starters/`, `factory/`,
> `capabilities/`, `deployment/` et `packages/` selon ADR-042. Les exemples historiques `cores/`
> conservés plus bas décrivent la V1 et ne doivent plus guider de nouveaux chemins ou CODEOWNERS.

## 1. Résumé exécutif

Ce document définit la stratégie Git officielle d’Enistere OS Foundation.

La stratégie Git doit permettre de gérer proprement :

- le repository principal de la fondation ;
- les cores ;
- les documents stratégiques ;
- les prompts IA ;
- les scripts ;
- les templates ;
- les versions ;
- les projets dérivés ;
- les contributions ;
- les releases ;
- les hotfixes ;
- les expérimentations.

L’objectif est de garantir une organisation claire, traçable, maintenable et compatible avec une exécution assistée par IA.

---

## 2. Objectif de la stratégie Git

La stratégie Git doit répondre aux questions suivantes :

```txt
Comment organiser les repositories ?
Faut-il un monorepo ou plusieurs repositories ?
Comment gérer les branches ?
Comment nommer les commits ?
Comment structurer les Pull Requests ?
Comment versionner chaque core ?
Comment gérer les releases ?
Comment connecter les projets dérivés à la fondation ?
Comment éviter que la fondation devienne désorganisée ?
```

---

## 3. Décision principale

La stratégie retenue est :

```txt
Monorepo pour Enistere OS Foundation
+
Repositories séparés pour les projets dérivés
```

Cette approche est appelée :

```txt
Stratégie hybride monorepo + projets séparés
```

---

## 4. Pourquoi un monorepo pour la fondation

Le monorepo permet de centraliser :

```txt
- vision
- gouvernance
- architecture
- roadmap
- standards
- cores
- prompts IA
- scripts
- templates
- exemples
- documentation
- ADR
- workflows CI/CD
```

Avantages :

```txt
- cohérence globale
- documentation centralisée
- standards communs
- versioning coordonné
- prompts IA unifiés
- meilleure traçabilité
- facilité de recherche
- facilité d’onboarding
```

---

## 5. Pourquoi des repositories séparés pour les projets dérivés

Les projets réels doivent rester séparés de la fondation.

Exemples :

```txt
kivvoo-api
kivvoo-mobile
rfashion-api
rfashion-buyer-mobile
rfashion-seller-mobile
bailo-api
bailo-web
vox-pulse-api
civis-id-platform
```

Avantages :

```txt
- cycles de release indépendants
- logique métier isolée
- secrets isolés
- environnement propre à chaque projet
- équipes projet séparables
- historique Git clair
- moins de pollution dans la fondation
```

---

## 6. Repository principal

Nom recommandé :

```txt
enistere-os-foundation
```

Rôle :

```txt
Repository central de stratégie, architecture, cores, standards, prompts, scripts et documentation.
```

Structure cible :

```txt
enistere-os-foundation/
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── CODEOWNERS
├── .github/
├── strategy/
├── docs/
├── starters/
├── factory/
├── capabilities/
├── deployment/
├── packages/
└── examples/
```

---

## 7. Organisation des cores dans le monorepo

Les cores sont placés dans :

```txt
cores/
```

Structure :

```txt
cores/
├── mobile-react-native/
├── mobile-flutter/
├── web-nextjs/
├── web-angular/
├── api-nestjs/
├── api-spring/
├── cloud/
├── ui-kit/
├── ai-core/
├── docs-core/
└── quality-core/
```

Chaque core doit contenir au minimum :

```txt
README.md
CORE_SPECIFICATION.md
ARCHITECTURE.md
INSTALLATION.md
USAGE.md
TESTING.md
SECURITY.md
DEPENDENCIES.md
ROADMAP.md
CHANGELOG.md
```

---

## 8. Organisation des projets dérivés

Un projet dérivé est un produit réel basé sur un ou plusieurs cores.

Exemple :

```txt
kivvoo/
├── kivvoo-api
├── kivvoo-mobile-buyer
├── kivvoo-mobile-delivery
├── kivvoo-web-admin
└── kivvoo-infra
```

Chaque projet dérivé doit avoir son propre repository ou groupe de repositories selon sa complexité.

---

## 9. Fichier foundation.md dans les projets dérivés

Chaque projet dérivé doit documenter son lien avec la fondation via :

```txt
foundation.md
```

Contenu recommandé :

```md
# Foundation Usage

## Foundation source

Repository : enistere-os-foundation  
Core utilisé : api-nestjs  
Version du core : api-nestjs-v0.1.0  

## Modules activés

- Auth
- Users
- Roles
- Upload
- Notifications

## Adaptations projet

- Ajout module Orders
- Ajout module Payments
- Ajout module Delivery

## Écarts avec la fondation

- Custom commission rules
- Provider paiement spécifique

## Améliorations à remonter à la fondation

- Upload retry
- Notification templates
```

---

## 10. Branching strategy

### 10.1 Stratégie recommandée au démarrage

Au début, utiliser une stratégie simple :

```txt
main
feature/*
fix/*
docs/*
chore/*
security/*
```

Pourquoi :

```txt
- simple
- adaptée à petite équipe
- compatible avec PR
- limite la complexité
```

---

### 10.2 Stratégie avancée possible plus tard

Quand la fondation devient plus mature :

```txt
main
develop
feature/*
fix/*
release/*
hotfix/*
```

Mais cette stratégie n’est pas nécessaire au départ.

---

## 11. Rôle des branches

### 11.1 main

```txt
main = branche stable
```

Règles :

```txt
- toujours stable
- pas de commit direct sauf exception
- merge via Pull Request
- releases taguées depuis main
```

---

### 11.2 feature/*

Pour les nouvelles fonctionnalités.

Exemples :

```txt
feature/api-nestjs/auth-module
feature/mobile-react-native/upload-client
feature/cloud/osrm-service
feature/ui-kit/button-component
```

---

### 11.3 fix/*

Pour les corrections.

Exemples :

```txt
fix/api-nestjs/jwt-refresh
fix/mobile-react-native/secure-storage
fix/cloud/traefik-config
```

---

### 11.4 docs/*

Pour la documentation.

Exemples :

```txt
docs/strategy/security
docs/cloud/osrm-guide
docs/api-nestjs/auth-readme
```

---

### 11.5 chore/*

Pour les tâches techniques non fonctionnelles.

Exemples :

```txt
chore/repo/setup-templates
chore/tools/init-script
chore/dependencies/update-lockfile
```

---

### 11.6 security/*

Pour les corrections ou améliorations sécurité.

Exemples :

```txt
security/api-nestjs/rate-limit-login
security/cloud/traefik-dashboard
security/mobile-react-native/token-storage
```

---

## 12. Convention de nommage des branches

Format :

```txt
<type>/<core-or-area>/<short-description>
```

Exemples :

```txt
feature/api-nestjs/auth-module
fix/mobile-react-native/upload-formdata
docs/cloud/osrm-setup
security/web-nextjs/csp-headers
chore/repo/github-templates
```

---

## 13. Commits

Utiliser Conventional Commits.

Format :

```txt
type(scope): message
```

Exemples :

```txt
feat(api-nestjs): add auth module
fix(mobile-react-native): correct upload client
docs(cloud): add osrm setup guide
security(api-nestjs): add login rate limiting
chore(repo): add pull request template
```

Types autorisés :

```txt
feat
fix
docs
style
refactor
test
chore
ci
build
perf
security
release
```

---

## 14. Scopes recommandés

Scopes par core :

```txt
api-nestjs
api-spring
mobile-react-native
mobile-flutter
web-nextjs
web-angular
cloud
ui-kit
ai-core
docs-core
quality-core
repo
strategy
prompts
tools
```

Exemples :

```txt
feat(ui-kit): add app button component
docs(strategy): update roadmap
ci(repo): add quality workflow
```

---

## 15. Pull Request policy

Toute modification significative doit passer par Pull Request.

Une PR doit contenir :

```txt
- résumé
- core concerné
- type de changement
- fichiers principaux modifiés
- tests exécutés
- documentation mise à jour
- risques connus
- captures si UI
- migration si nécessaire
```

---

## 16. Template Pull Request

Fichier :

```txt
.github/PULL_REQUEST_TEMPLATE.md
```

Contenu recommandé :

```md
# Pull Request

## Résumé

Décrire brièvement le changement.

## Core concerné

- [ ] api-nestjs
- [ ] api-spring
- [ ] mobile-react-native
- [ ] mobile-flutter
- [ ] web-nextjs
- [ ] web-angular
- [ ] cloud
- [ ] ui-kit
- [ ] ai-core
- [ ] docs-core
- [ ] quality-core
- [ ] repo/global

## Type de changement

- [ ] Feature
- [ ] Fix
- [ ] Documentation
- [ ] Refactor
- [ ] Test
- [ ] Security
- [ ] CI/CD
- [ ] Breaking change

## Tests exécutés

Indiquer les commandes exécutées.

## Documentation

- [ ] README mis à jour
- [ ] CHANGELOG mis à jour
- [ ] ADR ajouté si nécessaire
- [ ] Docs core mises à jour

## Sécurité

- [ ] Aucun secret ajouté
- [ ] Pas de logs sensibles
- [ ] Dépendances justifiées
- [ ] Impact sécurité vérifié

## Risques

Décrire les risques ou limites.

## Checklist

- [ ] Périmètre respecté
- [ ] Code lisible
- [ ] Tests OK
- [ ] Documentation OK
- [ ] Standards respectés
```

---

## 17. Règles de protection de branche

La branche `main` doit être protégée.

Règles recommandées :

```txt
- Pull Request obligatoire
- au moins 1 review
- status checks requis si CI disponible
- interdiction de force push
- interdiction de suppression
- historique linéaire si possible
```

Pour une petite équipe ou un solo founder, ces règles peuvent être allégées au début, mais doivent rester l’objectif.

---

## 18. CODEOWNERS

Fichier :

```txt
CODEOWNERS
```

Objectif :

```txt
Associer des zones du repo à des responsables.
```

Exemple :

```txt
/starters/nestjs/        @owner-api
/starters/react-native/ @owner-mobile
/deployment/core/             @owner-cloud
/packages/ui-kit/            @owner-ui
/strategy/                @owner-foundation
/factory/ai/prompts/                 @owner-ai
```

Au départ, un seul owner peut tout gérer.

---

## 19. Issues

Les issues doivent être structurées.

Types :

```txt
Feature
Bug
Documentation
Security
Architecture
Refactor
Tech Debt
Research
```

Labels recommandés :

```txt
type:feature
type:bug
type:docs
type:security
type:architecture
type:refactor
type:tech-debt
type:research

core:api-nestjs
core:mobile-react-native
core:web-nextjs
core:cloud
core:ui-kit
core:ai
core:docs
core:quality

priority:high
priority:medium
priority:low
```

---

## 20. Template Issue — Feature

```md
# Feature Request

## Besoin

Décrire le besoin.

## Core concerné

Exemple : api-nestjs, mobile-react-native, cloud.

## Objectif

Décrire le résultat attendu.

## Périmètre

Ce qui est inclus.

## Hors périmètre

Ce qui n’est pas inclus.

## Critères d’acceptation

- [ ] ...
- [ ] ...

## Documentation attendue

## Tests attendus

## Risques
```

---

## 21. Template Issue — Bug

```md
# Bug Report

## Description

Décrire le problème.

## Core concerné

## Étapes pour reproduire

1.
2.
3.

## Résultat attendu

## Résultat obtenu

## Logs ou captures

## Impact

## Solution possible
```

---

## 22. Template Issue — Security

```md
# Security Issue

## Description

Décrire le risque sans exposer de secret.

## Core concerné

## Niveau estimé

- [ ] Critical
- [ ] High
- [ ] Medium
- [ ] Low

## Impact

## Reproduction

## Correction proposée

## Mesures temporaires
```

---

## 23. Tags Git

Les releases doivent être taguées.

Format global :

```txt
foundation-v0.1.0
foundation-v1.0.0
```

Format par core :

```txt
api-nestjs-v0.1.0
mobile-react-native-v0.1.0
web-nextjs-v0.1.0
cloud-v0.1.0
ui-kit-v0.1.0
```

Règle :

```txt
Un tag doit correspondre à un état stable et documenté.
```

---

## 24. Versioning

Utiliser SemVer :

```txt
MAJOR.MINOR.PATCH
```

Règles :

```txt
PATCH : correction compatible
MINOR : nouvelle fonctionnalité compatible
MAJOR : breaking change
```

Exemples :

```txt
api-nestjs-v0.1.0
api-nestjs-v0.1.1
api-nestjs-v0.2.0
api-nestjs-v1.0.0
```

---

## 25. Changelog

Chaque core doit avoir son propre changelog :

```txt
starters/nestjs/CHANGELOG.md
starters/react-native/CHANGELOG.md
deployment/core/CHANGELOG.md
```

Le repository principal doit aussi avoir :

```txt
CHANGELOG.md
```

Le changelog global résume les changements majeurs.

---

## 26. Format changelog

```md
# Changelog

## [0.1.0] - YYYY-MM-DD

### Added

### Changed

### Fixed

### Security

### Deprecated

### Removed
```

---

## 27. Release process

Processus recommandé :

```txt
1. Vérifier issues terminées
2. Vérifier tests
3. Vérifier documentation
4. Mettre à jour changelog
5. Mettre à jour version
6. Créer PR de release
7. Merger sur main
8. Créer tag
9. Publier release GitHub
10. Documenter notes de migration si nécessaire
```

---

## 28. Release notes

Une release doit contenir :

```txt
- version
- date
- résumé
- nouveautés
- corrections
- sécurité
- breaking changes
- migrations
- cores impactés
- risques connus
```

---

## 29. Hotfix strategy

Un hotfix corrige un problème urgent sur une version stable.

Processus :

```txt
1. Créer branche hotfix/<core>/<description>
2. Corriger uniquement le problème
3. Tester
4. Revue rapide
5. Merge vers main
6. Tag patch
7. Documenter changelog
```

Exemple :

```txt
hotfix/api-nestjs/auth-token-validation
```

---

## 30. Expérimentations

Les expérimentations ne doivent pas polluer la fondation stable.

Dossier recommandé :

```txt
experiments/
```

Ou branches :

```txt
experiment/<topic>
```

Règles :

```txt
- pas de merge direct en main
- documentation courte obligatoire
- décision après test : intégrer, abandonner ou reporter
```

---

## 31. Gestion des prompts IA dans Git

Les prompts IA doivent être versionnés.

Structure :

```txt
factory/ai/prompts/
├── global/
├── architecture/
├── generation/
├── review/
├── security/
├── devops/
├── ux-ui/
└── documentation/
```

Chaque prompt doit préciser :

```txt
- rôle
- contexte
- usage
- inputs attendus
- outputs attendus
- interdictions
- version
```

---

## 32. Gestion des ADR dans Git

Les décisions majeures doivent être documentées dans :

```txt
docs/adr/
```

Exemples :

```txt
ADR-001-git-monorepo-hybrid.md
ADR-002-use-osrm.md
ADR-003-use-tanstack-query.md
ADR-004-use-traefik.md
```

Une PR qui introduit une décision majeure doit inclure l’ADR correspondant.

---

## 33. Gestion des secrets

Règles Git :

```txt
- aucun fichier .env réel
- aucun token
- aucune clé privée
- aucun mot de passe
- aucun certificat privé
```

`.gitignore` doit contenir :

```txt
.env
.env.*
!.env.example
*.pem
*.key
*.p12
```

Si un secret est commité :

```txt
1. considérer le secret compromis
2. le révoquer immédiatement
3. nettoyer l’historique si nécessaire
4. documenter l’incident
```

---

## 34. Gestion des fichiers générés

Les fichiers générés doivent être clairement identifiés.

Règles :

```txt
- ne pas commiter les builds inutiles
- commiter les lockfiles
- commiter les fichiers générés nécessaires au framework si requis
- documenter les commandes de génération
```

Exemples :

```txt
node_modules/ interdit
dist/ souvent interdit
build/ souvent interdit
coverage/ interdit
pubspec.lock accepté pour applications Flutter
package-lock.json accepté
pnpm-lock.yaml accepté
```

---

## 35. GitHub Projects

GitHub Projects peut être utilisé pour suivre la roadmap.

Colonnes recommandées :

```txt
Backlog
Ready
In Progress
Review
Testing
Done
Blocked
```

Vues recommandées :

```txt
- par core
- par version
- par priorité
- par type
```

---

## 36. Milestones

Créer des milestones :

```txt
V0 - Strategy
V1 - Priority Cores
V2 - Industrialization
V3 - Multi Framework
VF - Final Foundation
```

---

## 37. Labels recommandés

```txt
core:api-nestjs
core:api-spring
core:mobile-react-native
core:mobile-flutter
core:web-nextjs
core:web-angular
core:cloud
core:ui-kit
core:ai
core:docs
core:quality

type:feature
type:bug
type:docs
type:security
type:architecture
type:refactor
type:test
type:ci
type:research

priority:critical
priority:high
priority:medium
priority:low

status:blocked
status:needs-review
status:ready
status:in-progress
```

---

## 38. Relation entre foundation et projets dérivés

La fondation sert de base.

Les projets dérivés ne doivent pas modifier la fondation directement.

Processus recommandé :

```txt
1. Projet utilise un core
2. Projet adapte selon son métier
3. Une amélioration générique est identifiée
4. Une issue est créée dans enistere-os-foundation
5. L’amélioration est intégrée proprement dans la fondation
6. Une nouvelle version du core est publiée
7. Le projet dérivé peut se réaligner
```

---

## 39. Synchronisation des améliorations

Lorsqu’un projet dérivé améliore un module générique :

```txt
- extraire la partie générique
- supprimer le métier spécifique
- documenter l’usage
- ajouter tests
- proposer PR dans la fondation
```

---

## 40. Stratégie de duplication contrôlée

Au départ, il peut être acceptable de copier un core vers un projet dérivé.

Mais il faut documenter :

```txt
- version source
- modifications
- écarts
- améliorations à remonter
```

Le fichier `foundation.md` sert à cela.

---

## 41. Stratégie future possible : packages internes

Quand la fondation devient mature, certains éléments peuvent devenir des packages internes.

Exemples :

```txt
@enistere/ui-react
@enistere/ui-react-native
@enistere/api-client
@enistere/config
@enistere/eslint-config
```

Cette évolution doit venir plus tard, après stabilisation.

---

## 42. Stratégie future possible : template generators

La fondation pourra proposer des générateurs :

```txt
create-enistere-app
create-enistere-api
create-enistere-mobile
```

Mais en phase initiale, il est préférable de commencer avec :

```txt
scripts simples
templates documentés
copie contrôlée
```

---

## 43. Contribution workflow

Processus de contribution :

```txt
1. Créer issue
2. Définir périmètre
3. Créer branche
4. Modifier
5. Tester
6. Documenter
7. Ouvrir PR
8. Revue IA si utile
9. Revue humaine
10. Merge
11. Changelog
12. Release si nécessaire
```

---

## 44. Règles pour Codex / Claude Code

Quand Codex ou Claude Code travaille dans Git :

```txt
- créer ou utiliser une branche dédiée
- ne pas modifier main directement
- respecter le périmètre
- ne pas ajouter de dépendance non validée
- ne pas modifier plusieurs cores sans demande
- produire un résumé des changements
- indiquer les fichiers modifiés
- indiquer les tests à exécuter
```

Prompt obligatoire à inclure :

```txt
Ne modifie pas de fichiers hors périmètre.
Ne fais pas de refactor global.
Ne change pas l’architecture sans demande explicite.
Si une amélioration hors périmètre est utile, propose-la séparément.
```

---

## 45. Pull Request générée par IA

Une PR générée avec IA doit préciser :

```txt
- outil utilisé
- prompt ou résumé du prompt
- périmètre demandé
- fichiers modifiés
- points à vérifier humainement
```

---

## 46. Revue humaine obligatoire

La revue humaine est obligatoire pour :

```txt
- sécurité
- auth
- cloud
- dépendances critiques
- breaking changes
- architecture
- CI/CD
- prompts IA structurants
```

---

## 47. Anti-patterns Git interdits

Sont interdits :

```txt
- commits directs massifs sur main
- messages de commit vagues
- PR sans description
- merge d’un core non testé
- secret dans Git
- fichier .env réel
- dépendance ajoutée sans documentation
- modification de plusieurs cores sans justification
- génération IA massive sans revue
- release sans changelog
- breaking change sans version majeure
```

---

## 48. Critères de réussite de la stratégie Git

La stratégie Git est réussie si :

```txt
- l’historique est lisible
- les releases sont traçables
- chaque core est identifiable
- les changements sont documentés
- les PR expliquent les modifications
- les projets dérivés restent séparés
- les améliorations remontent proprement
- les agents IA peuvent travailler sans désorganiser le repo
```

---

## 49. Conclusion

La stratégie Git d’Enistere OS Foundation repose sur une approche hybride :

```txt
Monorepo pour la fondation.
Repositories séparés pour les projets dérivés.
```

Cette stratégie offre le meilleur équilibre entre cohérence, traçabilité, modularité et évolutivité.

Elle permet de construire une fondation solide tout en gardant les projets réels indépendants et propres.
