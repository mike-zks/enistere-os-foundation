# 10_AI_STRATEGY.md

# Enistere OS Foundation — Stratégie IA

## 1. Résumé exécutif

Ce document définit la stratégie d’utilisation de l’intelligence artificielle dans Enistere OS Foundation.

L’IA doit être utilisée comme un accélérateur d’analyse, de génération, de revue, de documentation, de test, de maintenance et de veille technologique.

Elle ne doit pas être utilisée comme un décideur autonome.

Enistere OS Foundation peut s’appuyer sur des outils comme :

- Codex ;
- Claude Code ;
- ChatGPT ;
- agents IA spécialisés ;
- prompts versionnés ;
- workflows IA ;
- RAG documentaire ;
- assistants de revue ;
- assistants de génération ;
- assistants DevOps ;
- assistants UX/UI.

L’objectif est d’industrialiser l’usage de l’IA tout en gardant une forte maîtrise humaine sur :

- l’architecture ;
- la sécurité ;
- les dépendances ;
- les choix structurants ;
- les releases ;
- les standards ;
- la gouvernance.

---

## 2. Objectif du document

Ce document répond aux questions suivantes :

```txt
Comment utiliser l’IA dans Enistere OS Foundation ?
Quels rôles donner à Codex ou Claude Code ?
Quelles tâches l’IA peut-elle faire ?
Quelles tâches ne doit-elle pas faire seule ?
Comment structurer les prompts ?
Comment contrôler les générations ?
Comment relire le code généré ?
Comment intégrer l’IA dans la chaîne d’exécution ?
Comment préparer un futur IA Core avancé ?
```

---

## 3. Principe fondamental

Le principe principal est :

```txt
L’IA accélère.
L’humain décide.
Les standards gouvernent.
Les tests valident.
La documentation stabilise.
```

L’IA ne doit jamais remplacer :

* la vision produit ;
* la gouvernance ;
* les décisions d’architecture ;
* la validation sécurité ;
* la revue humaine ;
* le contrôle qualité ;
* la responsabilité finale.

---

## 4. Positionnement de l’IA dans la fondation

L’IA est intégrée comme une couche transversale.

```txt
Enistere OS Foundation
├── Strategy
├── Architecture
├── Cores
├── Cloud
├── UI Kit
├── Quality
├── Docs
└── IA Assistance
    ├── Analyse
    ├── Génération
    ├── Revue
    ├── Documentation
    ├── Tests
    ├── DevOps
    ├── UX/UI
    └── Veille
```

Elle doit assister tous les cores :

* API Core ;
* Mobile Core ;
* Web Core ;
* Cloud Core ;
* UI Kit ;
* Docs Core ;
* Quality Core.

---

## 5. Objectifs de l’usage IA

L’IA doit permettre de :

```txt
- accélérer la rédaction des documents
- générer des structures de projets
- générer des modules cadrés
- créer des composants UI réutilisables
- proposer des tests
- relire le code
- identifier des risques
- améliorer la documentation
- générer des exemples
- assister la veille technologique
- analyser des projets dérivés
- proposer des refactorings
- vérifier la cohérence avec les standards
```

---

## 6. Limites de l’usage IA

L’IA ne doit pas :

```txt
- décider seule d’un choix architectural majeur
- ajouter une dépendance critique sans validation
- modifier plusieurs cores sans périmètre clair
- générer toute la fondation en une seule fois
- manipuler des secrets
- recevoir des fichiers .env réels
- exposer des données personnelles
- créer des breaking changes silencieux
- supprimer un module sans validation
- remplacer une revue humaine sécurité
- décider d’une release
```

---

## 7. Rôles IA officiels

La stratégie IA repose sur plusieurs rôles spécialisés.

---

## 7.1 AI Architect Assistant

Rôle :

Analyser et proposer des architectures.

Responsabilités :

```txt
- analyser un besoin
- proposer une structure
- comparer des options
- identifier les risques
- vérifier la cohérence avec la vision
- proposer un ADR si nécessaire
```

Limites :

```txt
- ne décide pas seul
- ne modifie pas le code directement
- ne choisit pas une technologie critique sans validation
```

---

## 7.2 AI Code Generator

Rôle :

Générer du code dans un périmètre limité.

Responsabilités :

```txt
- générer un module
- générer un composant
- générer un service
- générer un hook
- générer un DTO
- générer un script
- générer un test associé
```

Limites :

```txt
- ne doit pas générer un core complet en une seule fois
- ne doit pas modifier les standards
- ne doit pas ajouter de dépendance sans justification
- ne doit pas refactorer hors périmètre
```

---

## 7.3 AI Code Reviewer

Rôle :

Relire le code produit.

Responsabilités :

```txt
- vérifier la lisibilité
- vérifier la cohérence
- détecter duplications
- signaler risques
- vérifier erreurs/logs
- vérifier tests
- vérifier documentation
- vérifier dépendances
```

Limites :

```txt
- ne remplace pas la revue humaine
- ne valide pas seul une PR critique
```

---

## 7.4 AI Security Reviewer

Rôle :

Identifier les risques de sécurité.

Responsabilités :

```txt
- analyser auth
- vérifier gestion tokens
- vérifier permissions
- analyser uploads
- vérifier logs sensibles
- vérifier secrets
- analyser configuration cloud
- vérifier dépendances à risque
```

Limites :

```txt
- ne remplace pas un audit humain
- ne doit pas recevoir de secrets réels
```

---

## 7.5 AI DevOps Reviewer

Rôle :

Analyser les scripts, Docker, CI/CD et déploiements.

Responsabilités :

```txt
- vérifier Docker Compose
- vérifier Traefik
- vérifier variables env
- vérifier healthchecks
- vérifier volumes
- vérifier ports exposés
- vérifier backup strategy
- vérifier CI/CD
```

Limites :

```txt
- ne doit pas déployer en production sans validation
- ne doit pas manipuler de clés serveur
```

---

## 7.6 AI UX/UI Reviewer

Rôle :

Analyser l’expérience utilisateur et les composants UI.

Responsabilités :

```txt
- vérifier cohérence UI Kit
- vérifier états loading/error/empty
- vérifier accessibilité
- proposer micro-interactions
- vérifier navigation
- analyser ergonomie mobile/web
```

Limites :

```txt
- ne doit pas créer une nouvelle identité visuelle hors UI Kit
```

---

## 7.7 AI Documentation Assistant

Rôle :

Rédiger et maintenir la documentation.

Responsabilités :

```txt
- générer README
- générer guides
- générer exemples
- mettre à jour changelog
- rédiger ADR
- produire checklists
- résumer décisions
```

Limites :

```txt
- ne doit pas inventer une décision non validée
- ne doit pas documenter une fonctionnalité inexistante comme existante
```

---

## 7.8 AI Testing Assistant

Rôle :

Proposer et générer des tests.

Responsabilités :

```txt
- identifier les cas de test
- générer tests unitaires
- générer tests intégration
- proposer tests E2E
- signaler les zones non testées
```

Limites :

```txt
- ne garantit pas seul la qualité
- les tests doivent être exécutés réellement
```

---

## 8. Types d’usage IA

## 8.1 Analyse

Exemples :

```txt
- analyser un besoin métier
- analyser une architecture existante
- comparer deux options techniques
- identifier risques et contraintes
- proposer une roadmap
```

---

## 8.2 Génération

Exemples :

```txt
- générer structure projet
- générer module auth
- générer composant button
- générer service upload
- générer docker compose
- générer documentation
```

---

## 8.3 Revue

Exemples :

```txt
- revoir PR
- vérifier sécurité
- vérifier architecture
- détecter duplication
- vérifier standards
```

---

## 8.4 Maintenance

Exemples :

```txt
- analyser changelog framework
- proposer migration
- détecter dépendances obsolètes
- générer guide de migration
```

---

## 8.5 Veille technologique

Exemples :

```txt
- suivre frameworks
- comparer packages
- surveiller nouvelles pratiques
- analyser alternatives
```

---

## 9. Règle du périmètre strict

Toute tâche IA doit être limitée.

Exemple correct :

```txt
Génère le service SecureStorage pour Mobile Core React Native.
Périmètre autorisé :
- src/core/storage/secure-storage.ts
- src/core/storage/index.ts
- TESTING.md section storage

Ne modifie pas l’auth, l’API client ni la navigation.
```

Exemple incorrect :

```txt
Génère toute l’application mobile complète avec auth, API, UI, maps, notifications et tracking.
```

---

## 10. Format officiel d’un prompt IA

Chaque prompt important doit suivre ce format :

```md
# Prompt IA — Enistere OS Foundation

## Rôle attendu

Décrire le rôle de l’IA.

## Contexte

Décrire le core, le module, la version et les standards.

## Objectif

Décrire le résultat attendu.

## Périmètre autorisé

Lister les dossiers et fichiers autorisés.

## Hors périmètre

Lister ce que l’IA ne doit pas modifier.

## Standards à respecter

Référencer :
- 01_VISION_FINAL.md
- 02_GOVERNANCE.md
- 03_ARCHITECTURE_TARGET.md
- 05_EXECUTION_CHAIN.md
- 06_DEPENDENCY_STRATEGY.md
- 07_SECURITY.md
- 08_STANDARDS.md

## Contraintes techniques

Lister les packages, patterns et conventions.

## Livrables attendus

Lister les fichiers, tests, docs, exemples.

## Tests attendus

Décrire les tests.

## Documentation attendue

Décrire les fichiers docs à mettre à jour.

## Interdictions

- pas de dépendance non validée
- pas de refactor global
- pas de changement d’architecture
- pas de secret
- pas de modification hors périmètre
- pas de breaking change silencieux

## Format de réponse attendu

- résumé
- fichiers créés
- fichiers modifiés
- dépendances ajoutées
- commandes à exécuter
- tests
- documentation
- risques ou limites
```

---

## 11. Prompts à versionner

Tous les prompts utiles doivent être stockés dans :

```txt
prompts/
```

Structure recommandée :

```txt
prompts/
├── global/
│   ├── master-context.md
│   ├── execution-template.md
│   └── review-template.md
│
├── architecture/
│   ├── architecture-review.md
│   ├── adr-generator.md
│   └── technology-comparison.md
│
├── generation/
│   ├── module-generator.md
│   ├── component-generator.md
│   ├── api-endpoint-generator.md
│   └── cloud-service-generator.md
│
├── review/
│   ├── code-review.md
│   ├── dependency-review.md
│   ├── testing-review.md
│   └── documentation-review.md
│
├── security/
│   ├── security-review.md
│   ├── auth-review.md
│   ├── cloud-security-review.md
│   └── upload-security-review.md
│
├── devops/
│   ├── docker-review.md
│   ├── ci-cd-review.md
│   ├── traefik-review.md
│   └── backup-review.md
│
├── ux-ui/
│   ├── component-ux-review.md
│   ├── mobile-screen-review.md
│   └── web-dashboard-review.md
│
└── documentation/
    ├── readme-generator.md
    ├── changelog-generator.md
    ├── guide-generator.md
    └── core-doc-generator.md
```

---

## 12. Master context prompt

Un prompt global doit exister :

```txt
prompts/global/master-context.md
```

Rôle :

Fournir à l’agent IA le contexte de la fondation avant toute tâche.

Contenu recommandé :

```md
# Enistere OS Foundation — Master Context

Tu travailles sur Enistere OS Foundation.

Il s’agit d’une plateforme interne d’ingénierie logicielle composée de plusieurs cores :

- Mobile Core React Native
- Mobile Core Flutter
- Web Core Next.js
- Web Core Angular
- API Core NestJS
- API Core Spring Boot
- Cloud Core
- UI Kit
- IA Core
- Docs Core
- Quality Core

Tu dois respecter :

- la vision finale ;
- la gouvernance ;
- l’architecture cible ;
- la chaîne d’exécution ;
- la stratégie de dépendances ;
- la stratégie de sécurité ;
- les standards communs ;
- la stratégie Git.

Règles principales :

- ne jamais modifier hors périmètre ;
- ne jamais ajouter de dépendance sans justification ;
- ne jamais générer un core entier sans découpage ;
- ne jamais manipuler de secret ;
- toujours produire tests et documentation si nécessaire ;
- toujours signaler les risques ;
- toujours proposer les améliorations hors périmètre séparément.
```

---

## 13. Workflow IA standard

```txt
1. Préparer contexte
2. Définir tâche
3. Définir périmètre
4. Sélectionner prompt adapté
5. Exécuter génération ou analyse
6. Lire le résultat
7. Exécuter tests
8. Demander revue IA séparée
9. Faire revue humaine
10. Corriger
11. Documenter
12. Merger
```

---

## 14. Workflow avec Codex ou Claude Code

Utilisation recommandée :

```txt
1. Créer branche dédiée
2. Ouvrir le projet localement
3. Fournir master context
4. Fournir prompt spécifique
5. Demander un plan avant modification
6. Valider le plan
7. Autoriser génération
8. Lire diff Git
9. Exécuter tests
10. Demander correction limitée
11. Revue humaine
12. Commit propre
```

Commande mentale importante :

```txt
Plan first.
Code second.
Review always.
```

---

## 15. Règle “Plan First”

Pour toute tâche non triviale, l’IA doit d’abord produire un plan.

Exemple :

```txt
Avant de modifier les fichiers, propose :
- fichiers à créer
- fichiers à modifier
- approche technique
- tests prévus
- documentation prévue
- risques
Attends validation avant d’écrire le code.
```

Cette règle est obligatoire pour :

* auth ;
* cloud ;
* CI/CD ;
* sécurité ;
* dépendances ;
* architecture ;
* modules complexes ;
* refactoring.

---

## 16. Revue IA séparée

La revue doit être réalisée dans un second temps, idéalement avec un prompt différent.

Pourquoi :

```txt
Une IA qui génère peut rater ses propres erreurs.
Une revue séparée améliore la qualité.
```

Workflow :

```txt
Génération IA
→ tests
→ revue IA
→ correction
→ revue humaine
```

---

## 17. Prompts de génération

Un prompt de génération doit toujours demander :

```txt
- code propre
- structure respectée
- types
- gestion erreurs
- tests
- documentation
- résumé des changements
```

Il doit interdire :

```txt
- dépendances non validées
- refactor hors périmètre
- modification architecture
- secrets
- suppression de fichiers non demandée
```

---

## 18. Prompts de revue

Un prompt de revue doit vérifier :

```txt
- respect du périmètre
- respect des standards
- sécurité
- erreurs
- logs
- tests
- documentation
- dépendances
- performance
- maintenabilité
```

Le résultat attendu :

```txt
- points bloquants
- points à améliorer
- risques
- recommandations
- validation ou non-validation
```

---

## 19. Prompts de sécurité

Un prompt sécurité doit vérifier :

```txt
- auth
- permissions
- tokens
- secrets
- logs sensibles
- uploads
- CORS
- rate limiting
- cloud exposure
- dépendances
- données personnelles
```

Il doit toujours rappeler :

```txt
N’utilise aucun secret réel.
Ne demande aucun fichier .env réel.
```

---

## 20. Prompts DevOps

Un prompt DevOps doit vérifier :

```txt
- Dockerfile
- docker-compose
- Traefik
- ports exposés
- volumes
- healthchecks
- backups
- logs
- variables env
- CI/CD
- rollback
- monitoring
```

---

## 21. Prompts UX/UI

Un prompt UX/UI doit vérifier :

```txt
- cohérence UI Kit
- design tokens
- accessibilité
- états loading
- états error
- états empty
- responsive
- navigation
- animations
- micro-interactions
- simplicité d’usage
```

---

## 22. Prompts documentation

Un prompt documentation doit produire :

```txt
- objectif
- installation
- usage
- configuration
- exemples
- erreurs possibles
- tests
- limites
- bonnes pratiques
```

Il ne doit pas prétendre qu’une fonctionnalité existe si elle n’est pas implémentée.

---

## 23. Interdictions générales IA

L’IA ne doit jamais :

```txt
- accéder à des secrets
- recevoir des clés API
- recevoir un .env réel
- recevoir un dump complet contenant des données sensibles
- générer toute la fondation d’un coup
- modifier main directement
- ajouter un package sans justification
- supprimer un module sans demande explicite
- ignorer les tests
- ignorer la documentation
- changer un contrat API sans signaler un breaking change
- créer une architecture différente des standards
```

---

## 24. Données sensibles et IA

Ne jamais envoyer à l’IA :

```txt
- mots de passe
- tokens
- clés privées
- secrets CI/CD
- fichiers .env
- données personnelles réelles
- documents d’identité
- données bancaires
- dumps production
- logs contenant tokens ou emails sensibles
```

Si un log doit être analysé :

```txt
- anonymiser
- supprimer les tokens
- masquer les emails si nécessaire
- masquer les identifiants sensibles
```

---

## 25. IA et dépendances

Lorsque l’IA propose une dépendance, elle doit fournir :

```txt
- nom
- rôle
- raison
- alternative
- impact
- niveau de risque
- nécessité ou optionnalité
```

Aucune dépendance ne doit être ajoutée automatiquement sans validation.

---

## 26. IA et architecture

Pour toute décision architecturale, l’IA doit produire :

```txt
- contexte
- options
- comparaison
- recommandation
- risques
- impacts
- ADR proposé
```

La décision finale revient à l’humain.

---

## 27. IA et tests

L’IA doit systématiquement proposer des tests pour :

```txt
- modules API
- auth
- permissions
- services critiques
- composants UI critiques
- scripts Cloud critiques
- hooks complexes
```

Elle doit préciser les commandes à exécuter.

---

## 28. IA et documentation

Toute génération technique doit idéalement inclure :

```txt
- README ou section README
- exemples d’usage
- variables d’environnement
- limites connues
- erreurs possibles
```

---

## 29. IA et Cloud Core

L’IA peut aider sur Cloud Core, mais avec prudence.

Elle peut générer :

```txt
- docker-compose
- scripts setup
- documentation
- runbooks
- healthchecks
- exemples .env
```

Elle ne doit pas :

```txt
- déployer seule en production
- exposer un port sans justification
- manipuler secrets serveur
- désactiver sécurité
- modifier firewall sans validation
```

---

## 30. IA et OSRM

Pour OSRM, l’IA peut aider à :

```txt
- générer docker-compose.osrm.yml
- documenter import OSM
- créer scripts de préparation
- définir healthcheck
- proposer monitoring
- documenter fallback
```

Mais elle doit respecter :

```txt
- OSRM service interne par défaut
- pas d’exposition publique directe sans justification
- accès via API Routing Service
- documentation des volumes et données OSM
```

---

## 31. IA et UI Kit

L’IA peut générer des composants UI si elle respecte :

```txt
- design tokens
- variants
- états
- accessibilité
- documentation
- exemples
```

Elle ne doit pas créer :

```txt
- style isolé hors tokens
- identité visuelle contradictoire
- composants sans états loading/error/disabled
```

---

## 32. IA et projets dérivés

L’IA peut analyser un projet dérivé pour proposer :

```txt
- améliorations génériques à remonter
- écarts avec la fondation
- dette technique
- modules réutilisables
```

Elle doit distinguer :

```txt
logique métier spécifique
vs
fonctionnalité générique réutilisable
```

---

## 33. IA Core futur

À terme, Enistere OS Foundation doit intégrer un IA Core complet.

Objectifs :

```txt
- centraliser les prompts
- créer agents spécialisés
- indexer la documentation
- permettre RAG documentaire
- assister les développeurs
- auditer automatiquement
- générer des modules contrôlés
```

---

## 34. Architecture cible IA Core

```txt
ai-core/
├── README.md
├── CORE_SPECIFICATION.md
├── prompts/
├── agents/
├── workflows/
├── rag/
├── evaluations/
├── examples/
└── docs/
```

---

## 35. Agents IA cibles

Agents envisagés :

```txt
Foundation Architect Agent
API Core Agent
Mobile Core Agent
Web Core Agent
Cloud Core Agent
UI Kit Agent
Security Reviewer Agent
DevOps Reviewer Agent
Documentation Agent
Testing Agent
Dependency Reviewer Agent
Project Analyzer Agent
```

---

## 36. RAG documentaire

Le RAG documentaire doit permettre à l’IA d’interroger :

```txt
- stratégie
- architecture
- standards
- ADR
- core specifications
- guides
- checklists
- prompts
- changelogs
```

Objectif :

```txt
Répondre et générer en respectant la documentation officielle.
```

---

## 37. Évaluations IA

Les prompts et agents doivent être testés.

Critères :

```txt
- respecte le périmètre
- ne modifie pas hors scope
- ne propose pas de dépendance inutile
- documente correctement
- signale les risques
- respecte les standards
- produit un résultat exploitable
```

---

## 38. Versioning des prompts

Chaque prompt important doit avoir :

```txt
- nom
- version
- rôle
- date
- auteur ou owner
- changelog
```

Exemple :

```md
# module-generator.md

Version : 0.1.0
Owner : IA Core
Dernière mise à jour : YYYY-MM-DD
```

---

## 39. Journal des usages IA

Pour les tâches importantes, documenter :

```txt
- outil utilisé
- prompt utilisé
- core concerné
- résultat
- corrections humaines
- risques détectés
```

Cela peut être indiqué dans la Pull Request.

---

## 40. Checklist avant usage IA

```txt
- [ ] Le besoin est clair
- [ ] Le core est identifié
- [ ] Le périmètre est limité
- [ ] Le prompt est adapté
- [ ] Les fichiers autorisés sont listés
- [ ] Les interdictions sont précisées
- [ ] Aucun secret n’est fourni
- [ ] Les tests attendus sont définis
- [ ] La documentation attendue est définie
```

---

## 41. Checklist après usage IA

```txt
- [ ] Diff Git relu
- [ ] Aucun fichier hors périmètre modifié
- [ ] Aucune dépendance non validée ajoutée
- [ ] Aucun secret ajouté
- [ ] Tests exécutés
- [ ] Documentation mise à jour
- [ ] Risques analysés
- [ ] Revue humaine faite
- [ ] Changelog mis à jour si nécessaire
```

---

## 42. Critères de réussite de la stratégie IA

La stratégie IA est réussie si :

```txt
- l’IA accélère réellement le développement
- les générations restent cohérentes
- les standards sont respectés
- la documentation progresse
- les tests sont améliorés
- les dépendances restent maîtrisées
- la sécurité n’est pas affaiblie
- la revue humaine reste centrale
- les projets dérivés gagnent en vitesse
```

---

## 43. Anti-patterns interdits

Sont interdits :

```txt
- demander à l’IA de créer toute la fondation d’un coup
- copier-coller du code IA sans relecture
- laisser l’IA choisir une architecture critique seule
- fournir un .env réel à l’IA
- fournir des secrets à l’IA
- accepter une dépendance IA sans justification
- fusionner du code IA sans tests
- créer des prompts non versionnés
- ignorer les risques signalés
- utiliser l’IA pour contourner les standards
```

---

## 44. Conclusion

L’IA est un levier majeur pour Enistere OS Foundation.

Elle doit permettre de construire plus vite, mieux documenter, mieux tester, mieux analyser et mieux maintenir.

Mais sa valeur dépend du cadre qui l’entoure.

Le principe final est :

```txt
IA encadrée = accélérateur.
IA non contrôlée = dette technique.
```

Enistere OS Foundation doit donc utiliser l’IA de manière structurée, documentée, vérifiable et toujours alignée avec la gouvernance humaine.
