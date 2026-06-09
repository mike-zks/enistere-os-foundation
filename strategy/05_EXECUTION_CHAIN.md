# 05_EXECUTION_CHAIN.md

# Enistere OS Foundation — Chaîne d’Exécution

## 1. Résumé exécutif

Ce document définit la chaîne d’exécution officielle d’Enistere OS Foundation.

La chaîne d’exécution décrit comment passer d’une idée, d’un besoin ou d’un module à une livraison propre, validée, testée, documentée et versionnée.

Elle encadre notamment :

- la préparation des tâches ;
- l’utilisation de Codex, Claude Code ou autres agents IA ;
- la génération de code ;
- la revue humaine ;
- la revue IA ;
- les tests ;
- la documentation ;
- le versioning ;
- la release ;
- la maintenance.

L’objectif est d’éviter la génération désordonnée et de garantir que chaque évolution de la fondation respecte les standards Enistere.

---

## 2. Objectif du document

Ce document doit répondre aux questions suivantes :

```txt
Comment exécuter concrètement la roadmap ?
Comment utiliser l’IA sans perdre le contrôle ?
Comment générer un core ou un module proprement ?
Quand faire une revue humaine ?
Quels tests exécuter ?
Quand documenter ?
Quand versionner ?
Quand livrer ?
```

---

## 3. Principe fondamental

La chaîne d’exécution repose sur le principe suivant :

```txt id="eilyiv"
Aucune génération massive sans cadrage, validation, tests et documentation.
```

L’IA peut accélérer l’exécution, mais elle ne doit pas remplacer :

* l’architecture ;
* la décision humaine ;
* la revue ;
* la documentation ;
* la validation ;
* la gouvernance.

---

## 4. Vue globale de la chaîne d’exécution

```txt id="hbzqpw"
1. Identifier le besoin
2. Définir le périmètre
3. Vérifier les standards applicables
4. Préparer le prompt IA
5. Générer ou modifier
6. Revue automatique
7. Revue IA
8. Revue humaine
9. Tests
10. Documentation
11. Validation finale
12. Merge
13. Versioning
14. Release
15. Suivi post-release
```

---

## 5. Niveaux d’exécution

La chaîne d’exécution s’applique à plusieurs niveaux :

```txt id="9g2ff2"
- document stratégique
- core complet
- module
- composant UI
- service API
- script cloud
- prompt IA
- pipeline CI/CD
- configuration
- documentation
```

Le niveau d’exigence varie selon le risque.

---

## 6. Classification des tâches

### 6.1 Tâche documentaire

Exemples :

* rédiger une spécification ;
* mettre à jour un README ;
* ajouter une checklist ;
* créer un ADR ;
* documenter une installation.

Exigences :

```txt id="gssg8s"
- clarté
- cohérence
- structure
- lien avec les standards
- validation humaine
```

---

### 6.2 Tâche de génération technique

Exemples :

* générer un module NestJS ;
* générer un composant React Native ;
* créer un service Cloud ;
* créer une structure Next.js ;
* créer un pipeline GitHub Actions.

Exigences :

```txt id="iybx5q"
- prompt cadré
- périmètre limité
- dépendances justifiées
- tests
- documentation
- revue humaine
```

---

### 6.3 Tâche de refactor

Exemples :

* réorganiser un module ;
* nettoyer une architecture ;
* standardiser un service ;
* améliorer la lisibilité.

Exigences :

```txt id="aei79n"
- objectif clair
- aucun changement fonctionnel caché
- tests avant/après
- documentation si impact
- revue humaine
```

---

### 6.4 Tâche critique

Exemples :

* auth ;
* sécurité ;
* paiement ;
* gestion des tokens ;
* cloud production ;
* backups ;
* permissions ;
* secrets ;
* routing OSRM ;
* CI/CD release.

Exigences :

```txt id="fxah8i"
- ADR si nécessaire
- revue sécurité
- tests renforcés
- documentation obligatoire
- validation humaine obligatoire
```

---

## 7. Préparation avant exécution

Avant toute génération ou modification, il faut répondre à ces questions :

```txt id="xgu73k"
Quel est le besoin ?
Quel core est concerné ?
Quel module est concerné ?
Quel est le périmètre exact ?
Quels fichiers peuvent être modifiés ?
Quels fichiers ne doivent pas être modifiés ?
Quels standards s’appliquent ?
Quelles dépendances sont autorisées ?
Quels tests seront nécessaires ?
Quelle documentation sera mise à jour ?
```

---

## 8. Règle de périmètre strict

Une tâche doit avoir un périmètre limité.

Exemple correct :

```txt id="2ms0gz"
Créer le module Auth dans API Core NestJS avec :
- login
- register
- refresh token
- JWT strategy
- guards
- decorators
- tests unitaires
- documentation
```

Exemple incorrect :

```txt id="ki612r"
Créer toute l’API complète avec auth, paiement, notifications, upload, dashboard, CI/CD et tests.
```

---

## 9. Utilisation de Codex ou Claude Code

### 9.1 Rôle attendu

Codex ou Claude Code doivent être utilisés comme :

```txt id="blh099"
- assistant de génération
- assistant de refactor
- assistant de test
- assistant de documentation
- assistant de revue
```

Ils ne doivent pas être utilisés comme décideurs autonomes.

---

### 9.2 Règles d’utilisation

```txt id="uoyaz4"
- toujours fournir le contexte du core
- toujours fournir le périmètre exact
- toujours indiquer les fichiers concernés
- toujours indiquer les standards à respecter
- toujours demander une explication des changements
- toujours demander les tests associés
- toujours demander la documentation associée
- ne jamais demander une génération complète non cadrée
```

---

### 9.3 Prompt minimal obligatoire

Chaque prompt d’exécution doit contenir :

```txt id="l6cjlp"
1. Contexte
2. Objectif
3. Périmètre
4. Fichiers concernés
5. Contraintes
6. Standards à respecter
7. Livrables attendus
8. Tests attendus
9. Documentation attendue
10. Interdictions
```

---

## 10. Format officiel d’un prompt d’exécution

```md id="1gls5j"
# Prompt d’exécution — Enistere OS Foundation

## Contexte

Décrire le core, le module et le rôle du travail demandé.

## Objectif

Décrire le résultat attendu.

## Périmètre autorisé

Lister les fichiers ou dossiers pouvant être créés/modifiés.

## Hors périmètre

Lister ce qui ne doit pas être modifié.

## Standards à respecter

Référencer les documents de standards applicables.

## Contraintes techniques

Lister les packages, patterns, règles de sécurité, versioning.

## Livrables attendus

Lister les fichiers, modules, composants, tests, docs.

## Tests attendus

Décrire les tests à produire ou exécuter.

## Documentation attendue

Décrire les README, guides ou exemples à mettre à jour.

## Interdictions

Lister les interdictions :
- pas de dépendance non validée
- pas de refactor global
- pas de changement d’architecture non demandé
- pas de secret
- pas de code non documenté pour module critique

## Format de réponse attendu

Demander :
- résumé des changements
- fichiers modifiés
- commandes à exécuter
- points de vigilance
```

---

## 11. Pipeline d’exécution détaillé

## Étape 1 — Identifier le besoin

Un besoin peut venir :

* de la roadmap ;
* d’un projet pilote ;
* d’une dette technique ;
* d’une faille sécurité ;
* d’une veille technologique ;
* d’un problème récurrent ;
* d’une amélioration UX ;
* d’un besoin DevOps.

Livrable :

```txt id="iqg6r8"
fiche de besoin ou ticket
```

---

## Étape 2 — Définir le périmètre

La tâche doit être découpée.

Exemple :

```txt id="4wlhtj"
API Core NestJS
├── ConfigModule
├── DatabaseModule
├── AuthModule
├── UsersModule
├── UploadModule
└── HealthModule
```

Chaque module doit être exécuté séparément.

---

## Étape 3 — Vérifier les standards

Avant exécution, consulter :

```txt id="hnn5d4"
01_VISION_FINAL.md
02_GOVERNANCE.md
03_ARCHITECTURE_TARGET.md
06_DEPENDENCY_STRATEGY.md
07_SECURITY.md
08_STANDARDS.md
```

---

## Étape 4 — Préparer le prompt IA

Le prompt doit être précis, court si possible, mais suffisamment complet.

Il doit empêcher l’IA de :

* modifier trop de fichiers ;
* ajouter des dépendances inutiles ;
* changer l’architecture ;
* ignorer les tests ;
* ignorer la documentation.

---

## Étape 5 — Générer ou modifier

L’IA exécute uniquement le périmètre demandé.

Résultat attendu :

```txt id="waiswp"
- code ou documentation générée
- résumé des changements
- fichiers modifiés
- commandes proposées
- tests proposés
- risques identifiés
```

---

## Étape 6 — Revue automatique

Exécuter les commandes applicables :

```txt id="dzxmb4"
lint
format
typecheck
test
build
security audit
```

Selon le core :

```txt id="prspeq"
npm run lint
npm run test
npm run build
npm audit

flutter analyze
flutter test

mvn test
gradle test

docker compose config
docker compose up -d
```

---

## Étape 7 — Revue IA

Demander une revue IA séparée.

Objectif :

* détecter incohérences ;
* vérifier sécurité ;
* vérifier architecture ;
* vérifier documentation ;
* vérifier tests ;
* identifier dette technique.

Prompt de revue :

```txt id="iiy2xg"
Analyse ces changements selon les standards Enistere OS Foundation.
Vérifie :
- architecture
- sécurité
- dépendances
- tests
- documentation
- cohérence avec le core
- risques long terme
Ne propose pas de refactor hors périmètre.
```

---

## Étape 8 — Revue humaine

La revue humaine vérifie :

```txt id="ract1p"
- le besoin est réellement couvert
- le code est compréhensible
- l’architecture est respectée
- les erreurs sont gérées
- la sécurité est correcte
- les tests sont suffisants
- la documentation est présente
- aucune dépendance inutile n’a été ajoutée
- aucun secret n’est présent
```

---

## Étape 9 — Tests

Les tests dépendent du type de core.

### API Core

```txt id="mkfnki"
- tests unitaires
- tests intégration
- tests guards
- tests permissions
- tests DTO validation
```

### Mobile Core

```txt id="wnm5m2"
- tests hooks
- tests services
- tests composants critiques
- tests navigation si applicable
```

### Web Core

```txt id="d2oqyb"
- tests composants
- tests hooks
- tests forms
- tests pages critiques
```

### Cloud Core

```txt id="oybtpm"
- docker compose config
- health checks
- dry-run scripts
- tests backup/restore si possible
```

### UI Kit

```txt id="f63h95"
- tests composants
- revue visuelle
- accessibilité
```

---

## Étape 10 — Documentation

Chaque changement doit être documenté selon son niveau.

Documentation possible :

```txt id="u9knqf"
- README.md
- ARCHITECTURE.md
- USAGE.md
- INSTALLATION.md
- TESTING.md
- CHANGELOG.md
- ADR
- exemples
```

Règle :

```txt id="uymlw1"
Pas de module critique sans documentation.
```

---

## Étape 11 — Validation finale

Avant merge, vérifier :

```txt id="eifcbo"
- périmètre respecté
- tests OK
- documentation OK
- standards respectés
- pas de secret
- changelog mis à jour si nécessaire
- ADR présent si décision majeure
```

---

## Étape 12 — Merge

La fusion doit passer par Pull Request.

La PR doit inclure :

```txt id="h2n69a"
- résumé
- core concerné
- type de changement
- tests exécutés
- documentation mise à jour
- risques
- captures si UI
- migration si nécessaire
```

---

## Étape 13 — Versioning

Appliquer SemVer :

```txt id="nfyuxz"
PATCH : correction
MINOR : nouvelle fonctionnalité compatible
MAJOR : breaking change
```

Chaque core peut avoir sa version propre.

---

## Étape 14 — Release

Une release doit inclure :

```txt id="hdurc8"
- tag Git
- changelog
- notes de migration
- breaking changes
- état des tests
- date
```

---

## Étape 15 — Suivi post-release

Après release, vérifier :

```txt id="nf21sd"
- installation correcte
- documentation compréhensible
- absence de bug bloquant
- feedback projet pilote
- amélioration à intégrer
```

---

# PARTIE 2 — CHAÎNES SPÉCIFIQUES

## 12. Chaîne d’exécution pour créer un core

```txt id="a8swtd"
1. Créer CORE_SPECIFICATION.md
2. Créer ARCHITECTURE.md
3. Définir dépendances autorisées
4. Définir structure cible
5. Créer README initial
6. Créer backlog du core
7. Générer structure minimale
8. Ajouter configuration
9. Ajouter module par module
10. Tester chaque module
11. Documenter chaque module
12. Valider le core sur exemple
13. Versionner
```

---

## 13. Chaîne d’exécution pour créer un module

```txt id="urbnhk"
1. Définir besoin du module
2. Vérifier s’il existe déjà
3. Définir contrat du module
4. Préparer prompt IA
5. Générer structure du module
6. Ajouter logique
7. Ajouter tests
8. Ajouter documentation
9. Revue IA
10. Revue humaine
11. Merge
```

---

## 14. Chaîne d’exécution pour créer un composant UI

```txt id="qjhmp4"
1. Définir usage du composant
2. Vérifier design tokens
3. Définir variants
4. Définir états
5. Définir accessibilité
6. Générer composant
7. Ajouter exemples
8. Ajouter tests si critique
9. Revue visuelle
10. Documenter
```

États obligatoires :

```txt id="rvaq91"
- default
- hover si web
- pressed si mobile
- disabled
- loading
- error si applicable
```

---

## 15. Chaîne d’exécution pour Cloud Core

```txt id="6utkya"
1. Définir service cloud
2. Vérifier exposition réseau
3. Définir variables d’environnement
4. Définir volumes persistants
5. Définir healthcheck
6. Ajouter docker compose
7. Ajouter documentation
8. Tester docker compose config
9. Démarrer localement
10. Vérifier logs
11. Vérifier sécurité
12. Ajouter backup si service persistant
```

Services critiques :

```txt id="64yj71"
- PostgreSQL
- PostGIS
- Redis
- MinIO
- OSRM
- Traefik
- monitoring
```

---

## 16. Chaîne d’exécution pour IA Core

```txt id="aw7ysh"
1. Définir rôle du prompt ou agent
2. Définir contexte d’usage
3. Définir inputs attendus
4. Définir outputs attendus
5. Définir interdictions
6. Tester sur cas réel
7. Corriger le prompt
8. Documenter
9. Versionner
```

---

## 17. Chaîne d’exécution pour documentation

```txt id="gkie41"
1. Identifier le sujet
2. Identifier le public cible
3. Définir objectif du document
4. Structurer le document
5. Ajouter exemples
6. Ajouter checklists
7. Relire la cohérence
8. Versionner
```

---

# PARTIE 3 — MODÈLES DE WORKFLOW

## 18. Workflow recommandé pour un module API NestJS

```txt id="ssqca7"
Ticket :
Créer AuthModule

Prompt IA :
Générer AuthModule selon standards API Core NestJS

Résultat :
Code module Auth

Contrôles :
- lint
- test
- build
- revue sécurité
- documentation

Validation :
Core Owner + Reviewer Technique

Merge :
feature/api-nestjs-auth-module → main
```

---

## 19. Workflow recommandé pour un composant React Native

```txt id="rgf5f4"
Ticket :
Créer AppButton

Prompt IA :
Générer composant AppButton avec variants et états

Résultat :
Composant + exemple + tests

Contrôles :
- typecheck
- tests
- revue UI
- documentation

Validation :
UI Kit Owner + Mobile Core Owner
```

---

## 20. Workflow recommandé pour un service Cloud

```txt id="0k0mjp"
Ticket :
Ajouter OSRM au Cloud Core

Prompt IA :
Ajouter configuration OSRM Docker Compose avec documentation

Résultat :
docker-compose.osrm.yml + README + scripts

Contrôles :
- docker compose config
- test démarrage
- vérification volumes
- vérification ports
- revue sécurité

Validation :
Cloud Core Owner + Reviewer Sécurité
```

---

# PARTIE 4 — CONTRÔLES QUALITÉ

## 21. Quality gates minimaux

### Documentation

```txt id="r5eosg"
- README présent
- installation documentée
- usage documenté
- variables documentées
```

### Code

```txt id="6cxb0g"
- lint OK
- format OK
- typecheck OK
- tests critiques OK
- build OK
```

### Sécurité

```txt id="z74wd4"
- pas de secret
- dépendances justifiées
- permissions vérifiées
- uploads sécurisés
- configuration env propre
```

### Cloud

```txt id="85rn4q"
- docker compose config OK
- volumes documentés
- ports documentés
- healthcheck si possible
- backups si persistance
```

---

## 22. Checklist avant merge

```txt id="01i671"
- [ ] Périmètre respecté
- [ ] Code lisible
- [ ] Pas de dépendance non validée
- [ ] Pas de secret
- [ ] Tests exécutés
- [ ] Documentation mise à jour
- [ ] Changelog mis à jour si nécessaire
- [ ] ADR ajouté si décision majeure
- [ ] Revue IA effectuée si utile
- [ ] Revue humaine effectuée
```

---

## 23. Checklist avant release

```txt id="8ca1ii"
- [ ] Tous les tests critiques passent
- [ ] Documentation principale à jour
- [ ] Changelog complet
- [ ] Migration guide si breaking change
- [ ] Tags prêts
- [ ] Version cohérente SemVer
- [ ] Aucun secret
- [ ] Aucun TODO critique
- [ ] Projet exemple validé
```

---

# PARTIE 5 — RÈGLES SPÉCIALES IA

## 24. Ce que l’IA peut faire

```txt id="fp2fd6"
- générer une structure
- proposer du code
- créer des tests
- rédiger documentation
- faire revue
- identifier risques
- proposer refactor
```

---

## 25. Ce que l’IA ne doit pas faire seule

```txt id="e3rw0l"
- changer architecture globale
- ajouter dépendance critique
- supprimer module
- modifier sécurité
- changer stratégie auth
- changer stratégie cloud
- créer breaking change
- décider une release
```

---

## 26. Commandement principal pour l’IA

Tout prompt IA doit inclure cette règle :

```txt id="1gwix0"
Respecte strictement le périmètre demandé.
Ne modifie rien hors périmètre.
Si une amélioration hors périmètre semble nécessaire, propose-la séparément sans l’implémenter.
```

---

## 27. Réponse attendue de l’IA après génération

L’IA doit toujours fournir :

```txt id="w9zeaa"
- résumé des changements
- fichiers créés
- fichiers modifiés
- dépendances ajoutées
- commandes à exécuter
- tests ajoutés
- documentation ajoutée
- risques ou limites
```

---

# PARTIE 6 — TRAÇABILITÉ

## 28. Traçabilité minimale

Chaque tâche doit pouvoir être reliée à :

```txt id="khxnxz"
- un besoin
- un core
- une version
- un ticket
- une PR
- un changelog
- une documentation
```

---

## 29. Nommage des branches

Format recommandé :

```txt id="6m6ut8"
feature/<core>/<short-description>
fix/<core>/<short-description>
docs/<core>/<short-description>
chore/<core>/<short-description>
```

Exemples :

```txt id="la024e"
feature/api-nestjs/auth-module
feature/mobile-react-native/upload-client
docs/cloud/osrm-setup
fix/ui-kit/button-loading-state
```

---

## 30. Nommage des commits

Format recommandé :

```txt id="4gch8s"
type(scope): message
```

Exemples :

```txt id="ipq1td"
feat(api-nestjs): add auth module
fix(mobile-react-native): correct secure storage adapter
docs(cloud): add osrm setup guide
chore(ui-kit): update design tokens
```

Types recommandés :

```txt id="oy7kij"
feat
fix
docs
style
refactor
test
chore
ci
perf
security
```

---

# PARTIE 7 — OUTILS RECOMMANDÉS

## 31. Outils d’exécution

```txt id="a44nwj"
- GitHub
- GitHub Actions
- Codex
- Claude Code
- Docker
- Docker Compose
- npm/pnpm
- Flutter CLI
- Maven/Gradle
- linters
- test runners
```

---

## 32. Outils de documentation

```txt id="qjca6a"
- Markdown
- GitHub Wiki éventuel
- MkDocs ou Docusaurus plus tard
- ADR markdown
- Mermaid pour diagrammes
```

---

## 33. Outils de suivi

```txt id="r733j7"
- GitHub Issues
- GitHub Projects
- milestones
- labels par core
- labels par type
- labels par priorité
```

Labels recommandés :

```txt id="ms8m2b"
core:api-nestjs
core:mobile-react-native
core:web-nextjs
core:cloud
core:ui-kit
core:ai
type:feature
type:bug
type:docs
type:security
type:architecture
priority:high
priority:medium
priority:low
```

---

# PARTIE 8 — STRATÉGIE D’AMÉLIORATION CONTINUE

## 34. Retour des projets dérivés

Chaque projet dérivé doit pouvoir alimenter la fondation.

Processus :

```txt id="81cuzn"
1. Identifier une amélioration générique
2. La documenter
3. Vérifier qu’elle peut servir plusieurs projets
4. Créer ticket foundation
5. Implémenter proprement dans la fondation
6. Versionner
7. Réutiliser dans les projets
```

---

## 35. Boucle d’amélioration

```txt id="szycp6"
Projet réel
  ↓
Problème ou amélioration
  ↓
Analyse
  ↓
Foundation update
  ↓
Release
  ↓
Réutilisation dans d’autres projets
```

---

## 36. Conclusion

La chaîne d’exécution est le mécanisme qui permet à Enistere OS Foundation de rester contrôlée, cohérente et exploitable.

Elle garantit que chaque évolution suit un chemin clair :

```txt id="kv2v61"
Besoin → Prompt → Génération → Revue → Tests → Documentation → Versioning → Release
```

Avec cette chaîne, l’IA devient un accélérateur maîtrisé, et non une source de désordre technique.

Ce document doit être utilisé avant toute implémentation significative dans la fondation.
