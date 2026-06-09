# 02_GOVERNANCE.md

# Enistere OS Foundation — Gouvernance

## 1. Résumé exécutif

Ce document définit les règles de gouvernance d’Enistere OS Foundation.

La gouvernance a pour objectif d’assurer que la fondation reste :

- cohérente ;
- maintenable ;
- sécurisée ;
- évolutive ;
- documentée ;
- testée ;
- alignée avec la vision finale ;
- utilisable par plusieurs projets ;
- compatible avec une exécution assistée par IA.

Enistere OS Foundation ne doit pas évoluer au hasard.  
Chaque décision importante doit être cadrée, justifiée, documentée et validée.

---

## 2. Objectif de la gouvernance

La gouvernance sert à éviter :

- les choix techniques incohérents ;
- la duplication entre cores ;
- l’ajout incontrôlé de dépendances ;
- les ruptures de compatibilité non maîtrisées ;
- la dette technique ;
- les modules non documentés ;
- les composants non testés ;
- les architectures divergentes ;
- les générations IA non contrôlées ;
- la perte de vision long terme.

Elle permet de garantir que chaque évolution de la fondation respecte une logique commune.

---

## 3. Principes de gouvernance

### 3.1 Cohérence avant vitesse

La vitesse de développement est importante, mais elle ne doit jamais détruire la cohérence globale.

Une solution rapide mais non cohérente avec les standards Enistere OS Foundation doit être refusée ou retravaillée.

---

### 3.2 Documentation obligatoire

Tout changement significatif doit être documenté.

Un module, un composant ou une configuration non documenté est considéré comme incomplet.

---

### 3.3 Décision traçable

Les décisions importantes doivent être conservées sous forme d’ADR.

Exemples :

```txt
ADR-001-use-monorepo.md
ADR-002-use-tanstack-query.md
ADR-003-use-osrm.md
ADR-004-use-traefik.md
ADR-005-use-zustand.md
```

---

### 3.4 IA encadrée

Codex, Claude Code ou tout autre agent IA ne doivent pas modifier la fondation sans consigne claire.

Toute génération IA doit suivre :

```txt
1. un prompt validé ;
2. un périmètre précis ;
3. une tâche limitée ;
4. une revue automatique ;
5. une revue humaine ;
6. une documentation ;
7. des tests.
```

---

### 3.5 Sécurité par défaut

Toute nouvelle fonctionnalité doit être pensée avec une approche sécurité dès le départ.

Cela concerne :

* l’authentification ;
* les permissions ;
* les secrets ;
* les uploads ;
* les logs ;
* les données personnelles ;
* les tokens ;
* les APIs ;
* les dépendances ;
* l’infrastructure.

---

### 3.6 Versioning maîtrisé

Toute évolution doit respecter une stratégie de versioning claire :

```txt
MAJOR : breaking changes
MINOR : nouvelles fonctionnalités compatibles
PATCH : corrections et améliorations mineures
```

---

### 3.7 Tests proportionnés au risque

Toutes les parties critiques doivent avoir des tests.

Le niveau de test dépend du risque :

```txt
module critique     → tests unitaires + intégration + éventuellement E2E
module UI simple    → tests composants ou snapshots si utile
script infra        → validation manuelle + documentation + dry-run
module sécurité     → tests + revue humaine obligatoire
```

---

## 4. Rôles de gouvernance

Même si Enistere démarre avec une petite équipe, les rôles doivent être définis dès maintenant.

Une même personne peut porter plusieurs rôles au début.

---

### 4.1 Owner Fondation

Responsable de la vision globale.

Responsabilités :

* maintenir la cohérence globale ;
* valider les orientations stratégiques ;
* arbitrer les décisions majeures ;
* prioriser la roadmap ;
* accepter ou refuser les breaking changes ;
* valider les releases importantes.

---

### 4.2 Core Owner

Responsable d’un core spécifique.

Exemples :

* Mobile Core React Native Owner ;
* API Core NestJS Owner ;
* Cloud Core Owner ;
* UI Kit Owner ;
* IA Core Owner.

Responsabilités :

* maintenir le périmètre du core ;
* valider les modules du core ;
* assurer la documentation ;
* garantir la compatibilité avec les standards ;
* proposer les évolutions ;
* suivre les dépendances du core.

---

### 4.3 Reviewer Technique

Responsable de la revue technique.

Responsabilités :

* vérifier la qualité du code ;
* vérifier la structure ;
* vérifier les tests ;
* vérifier la cohérence avec les standards ;
* détecter les duplications ;
* identifier les risques de maintenance.

---

### 4.4 Reviewer Sécurité

Responsable des aspects sécurité.

Responsabilités :

* vérifier l’authentification ;
* vérifier la gestion des tokens ;
* vérifier les permissions ;
* vérifier les secrets ;
* vérifier les dépendances ;
* vérifier les uploads ;
* vérifier les configurations cloud ;
* vérifier les logs sensibles.

---

### 4.5 Reviewer UX/UI

Responsable de la cohérence visuelle et expérience utilisateur.

Responsabilités :

* vérifier le respect du UI Kit ;
* vérifier les composants ;
* vérifier les états loading/error/empty ;
* vérifier l’accessibilité ;
* vérifier la cohérence mobile/web ;
* vérifier les animations et micro-interactions.

---

### 4.6 IA Assistant

L’IA est considérée comme un assistant, pas comme un décideur.

Elle peut aider à :

* générer du code ;
* faire une revue ;
* proposer une architecture ;
* détecter des incohérences ;
* rédiger de la documentation ;
* produire des tests ;
* analyser des dépendances.

Elle ne doit pas valider seule une décision structurante.

---

## 5. Types de décisions

Les décisions sont classées par niveau d’impact.

---

### 5.1 Décision mineure

Exemples :

* renommage interne ;
* correction de documentation ;
* amélioration mineure d’un composant ;
* correction de bug sans impact API ;
* ajout de test.

Validation :

```txt
Core Owner ou Reviewer Technique
```

---

### 5.2 Décision moyenne

Exemples :

* ajout d’un module ;
* ajout d’un composant réutilisable ;
* ajout d’un package ;
* modification de structure interne ;
* changement de stratégie de test ;
* ajout d’un script d’automatisation.

Validation :

```txt
Core Owner + Reviewer Technique
```

Documentation requise :

```txt
README ou section dédiée
```

---

### 5.3 Décision majeure

Exemples :

* changement d’architecture ;
* changement de framework ;
* ajout d’une technologie structurante ;
* changement de stratégie auth ;
* changement de stratégie cloud ;
* changement de stratégie database ;
* changement de stratégie IA ;
* breaking change ;
* suppression d’un module.

Validation :

```txt
Owner Fondation + Core Owner + ADR obligatoire
```

Documentation requise :

```txt
ADR + mise à jour architecture + changelog
```

---

## 6. Architecture Decision Records

Les ADR permettent de tracer les décisions importantes.

Dossier recommandé :

```txt
docs/adr/
```

Format recommandé :

```txt
# ADR-XXX - Titre de la décision

## Statut

Proposé | Accepté | Rejeté | Remplacé | Déprécié

## Contexte

Pourquoi cette décision est étudiée ?

## Options analysées

- Option A
- Option B
- Option C

## Décision

Quelle option est retenue ?

## Justification

Pourquoi cette option est retenue ?

## Conséquences positives

- ...

## Conséquences négatives

- ...

## Impacts

- cores impactés
- documentation impactée
- migration nécessaire

## Date

YYYY-MM-DD
```

Exemples d’ADR nécessaires dès le départ :

```txt
ADR-001-organisation-git-monorepo-hybride.md
ADR-002-versioning-semver.md
ADR-003-cloud-core-traefik.md
ADR-004-cloud-core-osrm.md
ADR-005-mobile-react-native-api-strategy.md
ADR-006-ui-kit-design-tokens.md
ADR-007-ai-assisted-development.md
```

---

## 7. Cycle de vie d’une évolution

Toute évolution significative doit suivre le cycle suivant :

```txt
1. Proposition
2. Analyse
3. Décision
4. Planification
5. Implémentation
6. Tests
7. Revue IA
8. Revue humaine
9. Documentation
10. Merge
11. Release
12. Suivi post-release
```

---

## 8. Workflow détaillé

### 8.1 Proposition

Une évolution est proposée sous forme de ticket ou document.

Elle doit préciser :

* le besoin ;
* le core concerné ;
* le problème à résoudre ;
* la solution envisagée ;
* les impacts possibles ;
* le niveau de risque ;
* les dépendances concernées.

---

### 8.2 Analyse

L’analyse doit répondre aux questions suivantes :

```txt
Cette évolution est-elle nécessaire ?
Existe-t-il déjà une solution dans la fondation ?
Est-elle compatible avec les standards ?
Ajoute-t-elle de la complexité ?
Crée-t-elle une dépendance forte ?
A-t-elle un impact sécurité ?
A-t-elle un impact performance ?
A-t-elle un impact documentation ?
A-t-elle un impact sur les projets existants ?
```

---

### 8.3 Décision

Selon le niveau d’impact :

```txt
mineur  → validation simple
moyen   → validation Core Owner + Reviewer
majeur  → ADR + validation Owner Fondation
```

---

### 8.4 Implémentation

L’implémentation doit être limitée au périmètre validé.

Interdictions :

```txt
- refactor global non demandé
- ajout de package non validé
- modification d’architecture non documentée
- changement silencieux de comportement
- génération IA massive sans découpage
```

---

### 8.5 Tests

Les tests doivent être adaptés au type d’évolution.

Exemples :

```txt
API Core :
- tests unitaires services
- tests intégration contrôleurs
- tests permissions
- tests validation DTO

Mobile Core :
- tests hooks
- tests services
- tests composants critiques
- tests navigation si nécessaire

Cloud Core :
- validation docker compose
- health checks
- tests scripts
- dry-run backups

UI Kit :
- tests composants critiques
- revue visuelle
- accessibilité
```

---

### 8.6 Documentation

Chaque évolution doit mettre à jour :

```txt
- README du core si nécessaire
- documentation architecture si nécessaire
- changelog si nécessaire
- exemples si nécessaire
- ADR si décision majeure
```

---

### 8.7 Release

Une release doit contenir :

```txt
- version
- date
- changelog
- migrations nécessaires
- breaking changes
- corrections
- nouvelles fonctionnalités
- risques connus
```

---

## 9. Gouvernance des cores

Chaque core doit respecter une structure minimale.

```txt
/core-name/
├── README.md
├── CORE_SPECIFICATION.md
├── ARCHITECTURE.md
├── CHANGELOG.md
├── ROADMAP.md
├── examples/
├── docs/
└── src/ ou templates/
```

Selon le core, la structure peut varier, mais ces documents doivent exister.

---

## 10. Gouvernance du Cloud Core

Le Cloud Core est critique car il touche à l’infrastructure, à la sécurité, aux données et aux coûts.

Tout changement Cloud Core doit être traité avec prudence.

Composants critiques :

* Traefik ;
* Docker ;
* PostgreSQL ;
* PostGIS ;
* Redis ;
* MinIO ;
* OSRM ;
* monitoring ;
* backups ;
* CI/CD ;
* firewall ;
* secrets ;
* registry.

Règles spécifiques :

```txt
- aucun secret en clair dans Git
- toute configuration doit avoir un .env.example
- tout service doit avoir un healthcheck si possible
- tout service critique doit être documenté
- tout volume persistant doit être identifié
- toute stratégie backup doit être testable
- toute exposition publique doit passer par Traefik
- toute ouverture de port doit être justifiée
```

---

## 11. Gouvernance du UI Kit

Le UI Kit doit garantir la cohérence visuelle des produits Enistere.

Règles :

```txt
- les couleurs doivent venir des design tokens
- les espacements doivent suivre l’échelle définie
- les composants doivent gérer loading/error/disabled
- les composants critiques doivent avoir des exemples
- les composants doivent respecter l’accessibilité
- les composants web et mobile doivent partager la même philosophie UX
```

Aucune application ne doit créer une nouvelle identité UI sans justification.

---

## 12. Gouvernance du IA Core

L’IA Core doit permettre l’automatisation sans perte de contrôle.

Règles :

```txt
- aucun prompt critique sans documentation
- aucun agent IA sans rôle clair
- aucune génération globale sans validation
- toute génération doit produire un résultat vérifiable
- les prompts doivent être versionnés
- les agents doivent suivre les standards Enistere
- les décisions IA doivent être relues humainement
```

Types de prompts à gouverner :

* prompts d’architecture ;
* prompts de génération ;
* prompts de revue ;
* prompts de documentation ;
* prompts sécurité ;
* prompts DevOps.

---

## 13. Gestion des dépendances

Aucune dépendance ne doit être ajoutée sans justification.

Avant d’ajouter un package, vérifier :

```txt
- utilité réelle
- popularité
- maintenance
- licence
- sécurité
- taille
- compatibilité
- alternative native
- impact long terme
```

Toute dépendance structurante doit être documentée.

Les dépendances critiques doivent être listées dans :

```txt
ENISTERE_OS_FOUNDATION_DEPENDENCY_STRATEGY.md
```

---

## 14. Gestion des breaking changes

Un breaking change est une modification qui oblige les projets utilisateurs à adapter leur code.

Exemples :

* changement de structure ;
* changement de nom d’API ;
* suppression d’un module ;
* modification d’un contrat ;
* changement de stratégie auth ;
* changement d’un token UI ;
* modification d’un script Cloud.

Règles :

```txt
- breaking change interdit en PATCH
- breaking change autorisé uniquement en MAJOR
- migration guide obligatoire
- changelog obligatoire
- ADR obligatoire si impact majeur
```

---

## 15. Politique de dépréciation

Avant de supprimer une fonctionnalité, elle doit passer par une phase de dépréciation.

Processus :

```txt
1. Marquer comme deprecated
2. Documenter l’alternative
3. Ajouter une note dans le changelog
4. Prévoir une date ou version de suppression
5. Supprimer uniquement dans une version majeure
```

---

## 16. Stratégie de validation humaine

La validation humaine reste obligatoire pour :

* architecture ;
* sécurité ;
* cloud ;
* auth ;
* paiement ;
* données personnelles ;
* breaking changes ;
* choix de frameworks ;
* ajout de dépendances critiques ;
* prompts IA structurants.

Même si l’IA propose une bonne solution, la décision doit être assumée humainement.

---

## 17. Stratégie de revue IA

La revue IA est utile pour accélérer le contrôle qualité.

Elle peut vérifier :

* cohérence architecture ;
* duplication ;
* sécurité ;
* qualité du code ;
* documentation manquante ;
* tests manquants ;
* dépendances inutiles ;
* non-respect des standards.

Mais la revue IA ne remplace pas la revue humaine.

---

## 18. Branching strategy

Pour le repository principal :

```txt
main        → version stable
develop     → intégration continue
feature/*   → nouvelles fonctionnalités
fix/*       → corrections
release/*   → préparation version
hotfix/*    → corrections urgentes
```

Pour une petite équipe, une version simplifiée peut être utilisée :

```txt
main
feature/*
fix/*
```

Règle recommandée au démarrage :

```txt
main + feature branches + pull requests
```

---

## 19. Pull Request policy

Toute Pull Request doit contenir :

```txt
- résumé du changement
- core concerné
- type de changement
- tests exécutés
- documentation mise à jour
- captures si UI
- migrations si nécessaire
- risques connus
```

Template recommandé :

```md
## Résumé

## Core concerné

## Type de changement

- [ ] Feature
- [ ] Fix
- [ ] Refactor
- [ ] Documentation
- [ ] Breaking change

## Tests

## Documentation

## Risques

## Checklist

- [ ] Code conforme aux standards
- [ ] Tests ajoutés ou mis à jour
- [ ] Documentation mise à jour
- [ ] Pas de secret dans le code
- [ ] Pas de dépendance ajoutée sans justification
```

---

## 20. Release policy

Chaque release doit avoir :

```txt
- numéro de version
- tag Git
- changelog
- notes de migration
- liste des breaking changes
- état des tests
- état de la documentation
```

Format tag recommandé :

```txt
v0.1.0
v0.2.0
v1.0.0
```

Pour les cores spécifiques :

```txt
mobile-react-native-v0.1.0
api-nestjs-v0.1.0
cloud-v0.1.0
```

---

## 21. Critères d’acceptation d’un module

Un module est accepté seulement si :

```txt
- le besoin est clair
- l’architecture est conforme
- le code est lisible
- les erreurs sont gérées
- les tests nécessaires existent
- la documentation existe
- les exemples existent si nécessaire
- les dépendances sont justifiées
- la sécurité est vérifiée
- le changelog est mis à jour si nécessaire
```

---

## 22. Critères d’acceptation d’un core

Un core est considéré comme prêt si :

```txt
- son périmètre est documenté
- son architecture est documentée
- son installation est documentée
- ses modules principaux sont implémentés
- ses tests critiques existent
- ses scripts fonctionnent
- sa configuration est claire
- ses dépendances sont justifiées
- son changelog existe
- son README est exploitable
- il peut être utilisé dans un projet pilote
```

---

## 23. Gestion de la veille technologique

La veille technologique est obligatoire pour garder la fondation à jour.

Fréquence recommandée :

```txt
Mensuel :
- sécurité
- vulnérabilités
- dépendances critiques
- packages obsolètes

Trimestriel :
- frameworks
- nouvelles pratiques
- refactoring utile
- amélioration composants
- CI/CD

Semestriel :
- architecture globale
- dette technique
- choix structurants
- frameworks secondaires

Annuel :
- révision stratégique complète
- technologies à conserver
- technologies à remplacer
- nouvelles priorités
```

---

## 24. Registre des risques

Un registre des risques doit être maintenu.

Exemples de risques :

```txt
- complexité excessive
- multiplication des cores
- dépendances non maintenues
- documentation non à jour
- génération IA incohérente
- dette technique cachée
- sécurité insuffisante
- coût cloud mal maîtrisé
- maintenance trop lourde
```

Fichier recommandé :

```txt
docs/RISK_REGISTER.md
```

---

## 25. Règles de priorité

Les priorités doivent suivre cette logique :

```txt
1. Sécurité
2. Stabilité
3. Cohérence architecture
4. Utilisabilité réelle
5. Documentation
6. Performance
7. Automatisation
8. Innovation
```

L’innovation est importante, mais elle ne doit pas affaiblir la stabilité.

---

## 26. Gouvernance des projets dérivés

Les projets créés à partir d’Enistere OS Foundation doivent respecter les standards de la fondation.

Exemples :

```txt
Kivvoo
RFashion
Bailo
Vox Pulse
CIVIS ID
```

Chaque projet dérivé peut adapter la fondation, mais les améliorations utiles doivent être remontées vers la fondation.

Principe :

```txt
Chaque projet utilise la fondation.
Chaque projet peut améliorer la fondation.
```

---

## 27. Indicateurs de bonne gouvernance

La gouvernance est efficace si :

```txt
- les décisions sont traçables
- les cores restent cohérents
- les dépendances sont maîtrisées
- les releases sont compréhensibles
- les modules sont documentés
- les tests progressent
- les projets démarrent plus vite
- les coûts techniques diminuent
- les équipes comprennent facilement les standards
```

---

## 28. Anti-patterns interdits

Les pratiques suivantes sont interdites :

```txt
- générer tout un core en une seule fois sans revue
- ajouter une dépendance sans justification
- modifier une architecture sans ADR
- créer un composant UI hors design system
- exposer un service Cloud sans Traefik
- stocker des secrets dans Git
- ignorer les tests sur un module critique
- livrer un module sans README
- casser une API sans migration guide
- laisser l’IA décider seule d’un choix majeur
```

---

## 29. Conclusion

La gouvernance est un pilier central d’Enistere OS Foundation.

Elle garantit que la fondation reste stable, cohérente, évolutive et exploitable sur le long terme.

Sans gouvernance, la fondation risque de devenir une collection désorganisée de templates, de composants et de scripts.

Avec une gouvernance claire, Enistere OS Foundation devient une véritable plateforme interne d’ingénierie logicielle, capable d’accompagner durablement la croissance technique d’Enistere.
