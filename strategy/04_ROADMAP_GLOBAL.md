# 04_ROADMAP_GLOBAL.md

# Enistere OS Foundation — Roadmap Globale

> **Priorite V2 approuvee le 2026-07-18** : gel de l'expansion fonctionnelle des anciens cores, refonte
> immediate du repository, kernel `enistere`, adapters d'agents locaux, contrat commun des six starters,
> capability packs puis projets golden. Voir ADR-042. Les versions historiques ci-dessous restent une
> trace de construction, pas l'ordre d'execution courant.

## Roadmap V2 active

| Etape | Livrable | Preuve de sortie |
|---|---|---|
| R1 | Taxonomie `starters/factory/capabilities/deployment/packages` | aucun chemin operationnel `cores/` |
| R2 | Blueprint v1 + CLI `enistere` | validation et lock deterministes |
| R3 | Six manifests de starters | contrat commun install/dev/test/build/verify |
| R4 | Packs base/auth/rbac/files | dependances et contrats neutres testes |
| R5 | Agents locaux | worktree + deux approbations humaines |
| R6 | Packs local/staging | Compose genere, sans secret |
| R7 | Matrice golden 18 profils | generation hors depot reproductible |
| R8 | Golden runtimes | deux profils web et un profil mobile demarrent reellement |
| R9 | Compilateur de domaine | CRUD genere et teste sur les deux APIs |
| R10 | Cycle de vie | upgrade/migration/SemVer |
| R11 | Distribution | CLI et packages installables sans lien local |
| R12 | Adoption | metriques et feedback loop publies |

Les anciennes phases ci-dessous sont conservees comme historique de construction. Elles ne doivent
plus servir a autoriser une mission V2.

## 1. Résumé exécutif

Ce document définit la roadmap globale de mise en œuvre d’Enistere OS Foundation.

La roadmap permet de transformer la vision finale en une séquence claire, réaliste et contrôlée d’exécution.

Elle couvre :

- les phases de mise en place ;
- les versions cibles ;
- les livrables attendus ;
- les priorités ;
- les dépendances entre chantiers ;
- les critères de validation ;
- les risques ;
- la stratégie d’évolution continue.

Enistere OS Foundation doit être cadrée dans sa version finale dès le départ, mais implémentée progressivement afin d’éviter la dispersion, la dette technique et la complexité inutile.

---

## 2. Objectif de la roadmap

La roadmap a pour objectif de répondre aux questions suivantes :

```txt
Que doit-on construire ?
Dans quel ordre ?
Pourquoi cet ordre ?
Quels livrables sont attendus ?
Quels cores sont prioritaires ?
Quels cores viennent plus tard ?
Quand une version est-elle considérée comme prête ?
Comment maintenir la fondation dans le temps ?
```

---

## 3. Principe général

La roadmap repose sur un principe simple :

```txt
Cadrer large, implémenter progressivement.
```

Cela signifie :

* définir immédiatement la vision finale ;
* documenter tous les cores dès le départ ;
* cadrer les standards globaux ;
* préparer les prompts IA ;
* commencer l’implémentation par les cores prioritaires ;
* valider chaque étape avant d’élargir ;
* intégrer les cores secondaires après stabilisation du socle principal.

---

## 4. Versions cibles

La roadmap est structurée en cinq grandes versions :

```txt
V0  : Cadrage stratégique et architecture
V1  : Socle prioritaire prêt à l’emploi
V2  : Industrialisation et automatisation
V3  : Extension multi-framework
VF  : Version finale complète
```

---

## 5. Vue globale des versions

```txt
V0
├── Vision
├── Gouvernance
├── Architecture cible
├── Standards
├── Roadmap
├── Prompts IA
└── Spécifications des cores

V1
├── API Core NestJS
├── Mobile Core React Native
├── Web Core Next.js
├── Cloud Core minimal
└── UI Kit minimal

V2
├── Quality Core
├── Docs Core
├── Scripts d’automatisation
├── Versioning
├── CI/CD
├── Tests
└── Générateurs

V3
├── Mobile Core Flutter
├── API Core Spring Boot
├── Web Core Angular
├── Cloud Core avancé
└── UI Kit multi-framework

VF
├── IA Core avancé
├── RAG documentaire
├── Agents IA spécialisés
├── Cloud Core complet
├── Observabilité complète
├── Templates finalisés
└── Maintenance continue
```

---

# PARTIE 1 — VERSION V0

## 6. V0 — Cadrage stratégique et architecture

### 6.1 Objectif

La V0 a pour objectif de cadrer entièrement Enistere OS Foundation avant toute génération ou implémentation massive.

Cette version doit permettre de savoir :

* ce qu’est la fondation ;
* pourquoi elle existe ;
* comment elle est organisée ;
* comment elle évolue ;
* quels standards elle impose ;
* comment l’IA sera utilisée ;
* quels cores seront construits ;
* comment les projets dérivés l’utiliseront.

---

### 6.2 Livrables V0

Documents stratégiques :

```txt
strategy/
├── 01_VISION_FINAL.md
├── 02_GOVERNANCE.md
├── 03_ARCHITECTURE_TARGET.md
├── 04_ROADMAP_GLOBAL.md
├── 05_EXECUTION_CHAIN.md
├── 06_DEPENDENCY_STRATEGY.md
├── 07_SECURITY.md
├── 08_STANDARDS.md
├── 09_GIT_STRATEGY.md
└── 10_AI_STRATEGY.md
```

Documents complémentaires :

```txt
docs/
├── adr/
├── guides/
├── checklists/
├── runbooks/
├── onboarding/
├── decisions/
└── glossary/
```

Templates :

```txt
templates/
├── adr-template.md
├── core-specification-template.md
├── readme-template.md
└── changelog-template.md
```

Templates GitHub :

```txt
.github/
├── PULL_REQUEST_TEMPLATE.md
└── ISSUE_TEMPLATE/
    ├── feature_request.md
    ├── bug_report.md
    └── security_issue.md
```

Prompts :

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

---

### 6.3 Cores cadrés en V0

Tous les cores doivent avoir au minimum un document de spécification initial.

```txt
cores/
├── mobile-react-native/CORE_SPECIFICATION.md
├── mobile-flutter/CORE_SPECIFICATION.md
├── web-nextjs/CORE_SPECIFICATION.md
├── web-angular/CORE_SPECIFICATION.md
├── api-nestjs/CORE_SPECIFICATION.md
├── api-spring/CORE_SPECIFICATION.md
├── cloud/CORE_SPECIFICATION.md
├── ui-kit/CORE_SPECIFICATION.md
├── ai-core/CORE_SPECIFICATION.md
├── docs-core/CORE_SPECIFICATION.md
└── quality-core/CORE_SPECIFICATION.md
```

---

### 6.4 Critères de validation V0

La V0 est considérée comme terminée si :

```txt
- la vision finale est documentée
- la gouvernance est définie
- l’architecture cible est définie
- la roadmap globale est définie
- la stratégie Git est définie
- les standards communs sont définis
- la stratégie sécurité est définie
- la stratégie de dépendances est définie
- la stratégie IA est définie
- la chaîne d’exécution est définie
- chaque core a une première spécification
- les templates de documentation existent
```

---

# PARTIE 2 — VERSION V1

## 7. V1 — Socle prioritaire prêt à l’emploi

### 7.1 Objectif

La V1 doit fournir une première version utilisable de la fondation pour démarrer des projets réels.

Elle doit prioriser les technologies les plus directement utiles aux projets Enistere actuels.

---

### 7.2 Cores prioritaires V1

```txt
1. API Core NestJS
2. Mobile Core React Native
3. Web Core Next.js
4. Cloud Core minimal
5. UI Kit minimal
```

---

## 8. API Core NestJS V1

### 8.1 Objectif

Fournir une base backend robuste, sécurisée et prête à être étendue.

### 8.2 Modules V1

```txt
- ConfigModule
- DatabaseModule
- AuthModule
- UsersModule
- RolesModule
- PermissionsModule
- HealthModule
- LoggerModule
- ExceptionFilter
- ResponseInterceptor
- ValidationPipe
- CacheModule Redis
- UploadModule MinIO/S3
- MailModule minimal
- NotificationModule minimal
- Swagger/OpenAPI
```

### 8.3 Livrables

```txt
- structure projet NestJS
- docker-compose local
- .env.example
- README
- Swagger
- auth JWT
- refresh token strategy
- users CRUD minimal
- role-based access
- upload fichier
- health check
- tests unitaires critiques
```

### 8.4 Critères de validation

```txt
- l’API démarre localement
- Swagger est disponible
- la connexion DB fonctionne
- auth login/register fonctionne
- les rôles sont exploitables
- l’upload fonctionne
- les erreurs sont standardisées
- les logs sont lisibles
- les tests critiques passent
```

---

## 9. Mobile Core React Native V1

### 9.1 Objectif

Fournir une base mobile Expo/React Native prête pour des applications métier ou grand public.

### 9.2 Modules V1

```txt
- Expo Router
- API client
- Upload client fetch
- Auth flow
- Secure storage
- MMKV storage
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Theme system
- UI components minimal
- Notifications setup
- Error handling
- Empty states
- Loading states
```

### 9.3 Livrables

```txt
- structure projet mobile
- navigation auth/private
- login screen
- home screen
- settings screen
- API service
- upload service
- storage service
- query client
- theme provider
- composants de base
- README
- .env.example
```

### 9.4 Critères de validation

```txt
- l’app démarre avec Expo
- la navigation fonctionne
- le flow auth est prêt
- le token est stocké correctement
- les appels API fonctionnent
- l’upload via fetch fonctionne
- les composants UI de base existent
- les états loading/error/empty existent
```

---

## 10. Web Core Next.js V1

### 10.1 Objectif

Fournir une base Next.js moderne pour landing page, SaaS ou dashboard.

### 10.2 Modules V1

```txt
- App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Layout public
- Layout dashboard
- Auth pages
- API client
- TanStack Query
- React Hook Form
- Zod
- Theme support
- Error pages
- Data table minimal
```

### 10.3 Livrables

```txt
- structure projet Next.js
- page landing minimal
- dashboard layout
- login page
- settings page
- API service
- form example
- table example
- README
- .env.example
```

### 10.4 Critères de validation

```txt
- l’app démarre localement
- landing page accessible
- dashboard layout fonctionnel
- auth pages prêtes
- composants UI installés
- formulaires validés
- API client prêt
```

---

## 11. Cloud Core minimal V1

### 11.1 Objectif

Fournir une base d’infrastructure locale et serveur pour supporter les premiers projets.

### 11.2 Services V1

```txt
- Docker
- Docker Compose
- Traefik
- PostgreSQL
- Redis
- MinIO
- réseaux Docker
- volumes persistants
- .env.example
- scripts setup
```

### 11.3 Livrables

```txt
- docker-compose.base.yml
- docker-compose.local.yml
- docker-compose.prod.yml minimal
- traefik config
- postgres config
- redis config
- minio config
- scripts setup
- README Cloud Core
```

### 11.4 Critères de validation

```txt
- Traefik démarre
- PostgreSQL démarre
- Redis démarre
- MinIO démarre
- les volumes sont persistants
- les variables sont documentées
- aucun secret réel dans Git
```

---

## 12. UI Kit minimal V1

### 12.1 Objectif

Fournir une première base visuelle commune.

### 12.2 Contenu V1

```txt
- design tokens
- couleurs
- typographie
- spacing
- radius
- buttons
- inputs
- cards
- modals
- badges
- loading states
- empty states
- error states
```

### 12.3 Livrables

```txt
- tokens documentés
- composants React Native de base
- composants Next.js de base
- guidelines UX initiales
```

### 12.4 Critères de validation

```txt
- tokens définis
- composants principaux utilisables
- composants documentés
- cohérence visuelle minimale entre mobile et web
```

---

# PARTIE 3 — VERSION V2

## 13. V2 — Industrialisation et automatisation

### 13.1 Objectif

La V2 transforme la fondation en outil réellement productif.

Elle ajoute :

* qualité ;
* automatisation ;
* documentation avancée ;
* versioning ;
* scripts ;
* CI/CD ;
* génération de modules.

---

### 13.2 Chantiers V2

```txt
- Quality Core
- Docs Core
- GitHub Actions
- templates Pull Request
- templates issues
- scripts de génération
- changelog automatique ou semi-automatique
- release process
- tests renforcés
- prompts IA standardisés
- documentation centrale
```

---

### 13.3 Livrables V2

```txt
- Quality Core opérationnel
- Docs Core opérationnel
- pipeline CI minimal
- scripts lint/test/build
- scripts init projet
- prompts IA classés
- checklists qualité
- release templates
- documentation centrale navigable
```

---

### 13.4 Critères de validation V2

```txt
- les PR ont des templates
- les tests peuvent être lancés
- les scripts fonctionnent
- les releases sont documentées
- les prompts IA sont versionnés
- la documentation est structurée
- les checklists qualité existent
```

---

# PARTIE 4 — VERSION V3

## 14. V3 — Extension multi-framework

### 14.1 Objectif

La V3 ajoute les cores secondaires cadrés dès le départ.

```txt
- Mobile Core Flutter
- API Core Spring Boot
- Web Core Angular
```

Ces cores permettent d’adresser des besoins spécifiques :

* Flutter pour apps mobiles premium ;
* Spring Boot pour projets enterprise ;
* Angular pour backoffices complexes et SI administratifs.

---

## 15. Mobile Core Flutter V3

### 15.1 Modules

```txt
- Riverpod
- go_router
- Dio
- Freezed
- Json Serializable
- Secure Storage
- Hive ou Isar
- Theme system
- Auth flow
- API layer
- UI components
- Form validation
- Error handling
```

---

## 16. API Core Spring Boot V3

### 16.1 Modules

```txt
- Spring Security
- JWT
- Users
- Roles
- Permissions
- PostgreSQL
- JPA
- Redis
- MinIO
- OpenAPI
- Exception handling
- Audit logs
- Tests JUnit
- Testcontainers
```

---

## 17. Web Core Angular V3

### 17.1 Modules

```txt
- Angular standalone architecture
- Routing
- Guards
- Interceptors
- Reactive Forms
- Angular Material ou PrimeNG
- Tables
- Dashboard
- Auth
- Role-based UI
- OpenAPI client
- Tests
```

---

### 17.2 Critères de validation V3

```txt
- chaque core secondaire démarre localement
- chaque core a sa documentation
- chaque core respecte les standards communs
- chaque core possède un exemple minimal
- les dépendances sont justifiées
- les scripts de base fonctionnent
```

---

# PARTIE 5 — VERSION VF

## 18. VF — Version finale complète

### 18.1 Objectif

La version finale doit représenter la fondation complète, prête à l’emploi, maintenable et extensible.

Elle doit inclure :

* tous les cores ;
* documentation complète ;
* UI Kit multi-framework ;
* Cloud Core avancé ;
* IA Core complet ;
* Quality Core complet ;
* stratégie de veille ;
* exemples de projets ;
* scripts d’automatisation ;
* templates de génération ;
* processus de release.

---

## 19. Cloud Core complet VF

### 19.1 Services complets

```txt
- Docker
- Traefik
- PostgreSQL
- PostGIS
- Redis
- MinIO
- OSRM
- Prometheus
- Grafana
- Loki
- Alerting
- Backups
- CI/CD
- Registry
- Firewall
- Fail2Ban
- Secrets management
- Health checks
- Deployment scripts
```

---

## 20. IA Core complet VF

### 20.1 Composants

```txt
- prompts standards
- agents IA spécialisés
- RAG documentaire
- assistant architecture
- assistant code review
- assistant sécurité
- assistant DevOps
- assistant UX/UI
- assistant documentation
- assistant migration
```

---

## 21. UI Kit complet VF

### 21.1 Déclinaisons

```txt
- UI Kit React Native
- UI Kit Flutter
- UI Kit Next.js
- UI Kit Angular
```

### 21.2 Composants avancés

```txt
- headers
- navigation bars
- bottom sheets
- modals
- tables
- charts
- carousels
- maps components
- upload components
- notifications
- timelines
- empty states
- skeleton loaders
- error states
- dashboards
```

---

## 22. Quality Core complet VF

### 22.1 Capacités

```txt
- lint
- formatting
- unit tests
- integration tests
- E2E tests
- dependency audit
- security audit
- performance checks
- accessibility checks
- code review checklists
- CI quality gates
```

---

## 23. Critères de validation VF

La version finale est considérée comme prête si :

```txt
- tous les cores sont documentés
- tous les cores démarrent localement
- les cores prioritaires sont utilisables en projet réel
- les cores secondaires ont au moins un starter exploitable
- le Cloud Core supporte un déploiement réel
- le UI Kit est cohérent entre web et mobile
- les prompts IA sont versionnés
- les scripts d’automatisation fonctionnent
- la stratégie de release est appliquée
- la documentation centrale est complète
- un projet pilote peut être créé rapidement
```

---

# PARTIE 6 — PRIORITÉS TRANSVERSALES

## 24. Priorité 1 — Sécurité

La sécurité passe avant la vitesse.

Chantiers :

```txt
- auth
- secrets
- tokens
- RBAC
- rate limiting
- upload security
- cloud hardening
- dependency audit
```

---

## 25. Priorité 2 — Stabilité

La fondation doit être fiable.

Chantiers :

```txt
- tests
- health checks
- logs
- monitoring
- error handling
- backups
```

---

## 26. Priorité 3 — Cohérence

Les cores doivent suivre les mêmes principes.

Chantiers :

```txt
- standards
- documentation
- naming
- architecture
- UI Kit
- review process
```

---

## 27. Priorité 4 — Productivité

La fondation doit réellement faire gagner du temps.

Chantiers :

```txt
- scripts setup
- project init
- module generators
- examples
- prompts IA
- templates
```

---

## 28. Priorité 5 — Innovation

L’innovation vient après la stabilité.

Chantiers :

```txt
- IA Core
- RAG
- agents
- automation avancée
- maps/routing avancé
- composants UX premium
```

---

# PARTIE 7 — DÉPENDANCES ENTRE CHANTIERS

## 29. Dépendances principales

```txt
Vision → Gouvernance → Architecture → Standards → Roadmap
Roadmap → Core Specifications
Core Specifications → Prompts IA
Prompts IA → Génération contrôlée
Cloud Core minimal → API Core local
API Core → Mobile/Web integration
UI Kit → Mobile/Web UI consistency
Quality Core → Release stable
Docs Core → Onboarding et maintenance
IA Core → Automatisation avancée
```

---

## 30. Ordre recommandé d’exécution

```txt
1. Phase 0 Documents stratégiques
2. Structure repository
3. Spécifications des cores
4. Prompts IA standards
5. API Core NestJS V1
6. Cloud Core minimal V1
7. Mobile Core React Native V1
8. Web Core Next.js V1
9. UI Kit minimal V1
10. Quality Core V2
11. Docs Core V2
12. Scripts automatisation V2
13. Cloud Core avancé
14. Flutter Core
15. Spring Boot Core
16. Angular Core
17. IA Core avancé
18. Version finale
```

---

# PARTIE 8 — RISQUES DE ROADMAP

## 31. Risques principaux

```txt
- vouloir tout implémenter en même temps
- générer trop de code avec l’IA sans revue
- sous-documenter les décisions
- multiplier les dépendances
- créer des cores trop lourds
- négliger le Cloud Core
- négliger les tests
- ne pas tester sur un projet réel
- confondre fondation et logique métier
```

---

## 32. Mesures de réduction des risques

```txt
- cadrage complet avant implémentation
- génération module par module
- revue humaine obligatoire
- ADR pour décisions majeures
- dépendances justifiées
- documentation obligatoire
- projet pilote
- quality gates
- releases progressives
```

---

# PARTIE 9 — PROJET PILOTE

## 33. Objectif du projet pilote

Un projet pilote doit être utilisé pour valider la fondation.

Il permet de vérifier :

* la facilité d’installation ;
* la clarté de la documentation ;
* la cohérence des cores ;
* la réutilisabilité des composants ;
* l’intégration API/mobile/web ;
* l’exploitabilité du Cloud Core.

---

## 34. Projet pilote recommandé

Projet pilote recommandé :

```txt
Kivvoo Starter
```

Pourquoi :

* besoin mobile ;
* besoin API ;
* besoin admin web ;
* besoin tracking ;
* besoin upload ;
* besoin paiement ;
* besoin notifications ;
* besoin cloud ;
* besoin cartes/routing.

Alternative :

```txt
RFashion Starter
```

---

## 35. Critères de validation par projet pilote

```txt
- démarrer API depuis API Core
- démarrer mobile depuis Mobile Core
- démarrer dashboard depuis Web Core
- déployer localement via Cloud Core
- utiliser UI Kit
- connecter auth
- tester upload
- tester notifications
- tester logs
- documenter les écarts
```

---

# PARTIE 10 — MAINTENANCE CONTINUE

## 36. Veille technologique

Fréquence recommandée :

```txt
Mensuelle :
- vulnérabilités
- dépendances critiques
- bugs majeurs

Trimestrielle :
- frameworks
- performances
- refactoring
- composants UI
- CI/CD

Semestrielle :
- architecture globale
- pertinence des cores
- dette technique

Annuelle :
- révision stratégique complète
- technologies à conserver
- technologies à remplacer
- nouvelles priorités
```

---

## 37. Backlog continu

La fondation doit maintenir un backlog continu composé de :

```txt
- bugs
- améliorations
- nouvelles fonctionnalités
- refactoring
- documentation
- dette technique
- veille technologique
- sécurité
```

---

## 38. Release continue

Rythme recommandé :

```txt
Patch :
dès qu’un correctif important est prêt

Minor :
toutes les 4 à 8 semaines selon avancement

Major :
uniquement pour breaking changes ou changements structurants
```

---

# PARTIE 11 — INDICATEURS DE SUCCÈS

## 39. Indicateurs qualitatifs

```txt
- documentation claire
- installation simple
- architecture compréhensible
- composants réutilisables
- IA capable de suivre les prompts
- cohérence entre projets
- diminution des erreurs répétitives
```

---

## 40. Indicateurs quantitatifs

```txt
- temps de démarrage projet réduit
- nombre de modules réutilisés
- nombre de composants UI réutilisés
- taux de couverture tests sur modules critiques
- nombre de bugs récurrents réduit
- nombre de décisions documentées en ADR
- nombre de projets dérivés utilisant la fondation
```

---

## 41. Objectif long terme

L’objectif final est que chaque nouveau projet Enistere puisse démarrer à partir d’un core existant avec une base :

```txt
- documentée
- testée
- sécurisée
- configurable
- cohérente
- prête pour production
```

---

## 42. Conclusion

La roadmap globale d’Enistere OS Foundation permet de transformer une vision ambitieuse en une trajectoire maîtrisée.

Elle évite de construire dans le désordre et impose une progression logique :

```txt
Cadrage → Architecture → Standards → Cores prioritaires → Industrialisation → Extension → IA → Version finale
```

La réussite de cette roadmap dépendra de la discipline d’exécution, de la qualité de la documentation, de la gouvernance, et de la capacité à valider chaque étape avant de passer à la suivante.
