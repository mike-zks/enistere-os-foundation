# 06_DEPENDENCY_STRATEGY.md

# Enistere OS Foundation — Stratégie de Gestion des Dépendances

## 1. Résumé exécutif

Ce document définit la stratégie officielle de gestion des dépendances pour Enistere OS Foundation.

Une dépendance est tout élément externe utilisé par un core, un module, un projet ou une infrastructure :

- package npm ;
- package Flutter/Dart ;
- librairie Java ;
- image Docker ;
- service cloud ;
- outil CLI ;
- composant UI ;
- SDK externe ;
- API tierce ;
- module open source ;
- plugin framework.

L’objectif est de garantir que la fondation reste :

- légère ;
- stable ;
- sécurisée ;
- maintenable ;
- performante ;
- cohérente ;
- compatible long terme ;
- simple à mettre à jour ;
- résistante à l’abandon de packages.

Aucune dépendance ne doit être ajoutée sans justification claire.

---

## 2. Objectif du document

Ce document répond aux questions suivantes :

```txt
Quand peut-on ajouter une dépendance ?
Comment choisir un package ?
Quels critères vérifier ?
Quelles dépendances sont autorisées ?
Quelles dépendances sont à éviter ?
Comment gérer les mises à jour ?
Comment gérer les vulnérabilités ?
Comment retirer une dépendance ?
Comment éviter le surpoids technique ?
```

---

## 3. Principe fondamental

La règle principale est :

```txt
Moins de dépendances, mais de meilleures dépendances.
```

Une dépendance doit être ajoutée uniquement si elle apporte une valeur réelle, durable et difficile à reproduire proprement en interne.

---

## 4. Risques liés aux dépendances

Une dépendance mal choisie peut provoquer :

* failles de sécurité ;
* incompatibilités ;
* dette technique ;
* surpoids applicatif ;
* bugs non maîtrisés ;
* dépendance à un projet abandonné ;
* difficulté de migration ;
* conflits de versions ;
* complexité de build ;
* instabilité CI/CD ;
* problèmes de licence ;
* augmentation des coûts de maintenance.

---

## 5. Règles générales

### 5.1 Aucune dépendance sans justification

Avant d’ajouter une dépendance, il faut expliquer :

```txt
Pourquoi cette dépendance est nécessaire ?
Quel problème elle résout ?
Existe-t-il déjà une solution dans le core ?
Existe-t-il une solution native ?
Existe-t-il une alternative plus simple ?
Quel est l’impact long terme ?
```

---

### 5.2 Préférer les dépendances standards de l’écosystème

Les dépendances largement adoptées, bien maintenues et bien documentées sont préférables aux packages récents, peu connus ou expérimentaux.

---

### 5.3 Éviter les dépendances gadgets

Une dépendance ne doit pas être ajoutée pour :

* une simple fonction utilitaire ;
* un effet visuel mineur ;
* une abstraction inutile ;
* une commodité ponctuelle ;
* une mode technique ;
* un besoin non confirmé.

---

### 5.4 Éviter les doublons fonctionnels

Il ne doit pas y avoir plusieurs packages pour le même rôle sans justification.

Exemples à éviter :

```txt
axios + ky + got pour le même usage HTTP
redux + zustand + jotai pour le même état global
moment + date-fns + dayjs dans le même core
plusieurs librairies UI concurrentes dans un même starter
```

---

### 5.5 Une dépendance structurante nécessite une décision formelle

Toute dépendance qui influence l’architecture doit être validée.

Exemples :

* ORM ;
* système d’auth ;
* state management ;
* UI framework ;
* routing ;
* queue system ;
* storage ;
* maps ;
* observability ;
* testing framework.

Ces décisions doivent être documentées dans un ADR si elles sont majeures.

---

## 6. Classification des dépendances

### 6.1 Dépendance mineure

Exemples :

* petit utilitaire ;
* helper non critique ;
* package de développement ;
* plugin lint ;
* package de test.

Validation :

```txt
Core Owner ou Reviewer Technique
```

---

### 6.2 Dépendance moyenne

Exemples :

* librairie formulaire ;
* librairie validation ;
* client HTTP ;
* librairie UI secondaire ;
* outil build ;
* SDK externe non critique.

Validation :

```txt
Core Owner + Reviewer Technique
```

Documentation :

```txt
DEPENDENCIES.md du core
```

---

### 6.3 Dépendance critique

Exemples :

* framework principal ;
* ORM ;
* auth ;
* sécurité ;
* stockage ;
* queue ;
* maps ;
* cloud ;
* monitoring ;
* paiement ;
* IA ;
* base de données ;
* reverse proxy.

Validation :

```txt
Owner Fondation + Core Owner + ADR obligatoire
```

Documentation :

```txt
ADR + DEPENDENCIES.md + SECURITY.md si applicable
```

---

## 7. Critères d’évaluation d’une dépendance

Avant adoption, vérifier :

```txt
- utilité réelle
- maturité
- maintenance active
- fréquence des releases
- communauté
- documentation
- compatibilité framework
- compatibilité licence
- vulnérabilités connues
- taille du package
- impact performance
- impact build
- qualité TypeScript si JS/TS
- facilité de migration
- alternatives possibles
- risque d’abandon
```

---

## 8. Grille de décision

Chaque dépendance importante doit être évaluée selon cette grille :

```txt
Nom :
Core concerné :
Rôle :
Type : mineure / moyenne / critique
Problème résolu :
Alternatives analysées :
Avantages :
Inconvénients :
Risques :
Licence :
Maintenance :
Impact sécurité :
Impact performance :
Impact bundle :
Décision :
Date :
Responsable :
```

---

## 9. Politique par type de dépendance

## 9.1 Frameworks principaux

Les frameworks principaux sont les bases structurelles.

Frameworks retenus pour la fondation :

```txt
Mobile :
- React Native / Expo
- Flutter

Web :
- Next.js
- Angular

API :
- NestJS
- Spring Boot

Cloud :
- Docker
- Traefik
```

Règle :

```txt
Un framework principal ne peut pas être remplacé sans ADR majeur.
```

---

## 9.2 Clients HTTP

Objectif :

Standardiser les appels API.

Recommandation :

```txt
React Native :
- axios pour JSON
- fetch pour upload multipart/form-data

Next.js :
- axios ou fetch selon stratégie du core
- TanStack Query pour server state côté client

Flutter :
- Dio

NestJS :
- HttpModule si nécessaire pour appels externes

Spring Boot :
- WebClient ou RestClient selon version et besoin
```

Règle importante React Native :

```txt
Pour les uploads multipart/form-data, fetch est recommandé afin d’éviter certains problèmes de boundary et de compatibilité rencontrés avec Axios dans React Native.
```

---

## 9.3 Server state et cache client

Recommandation :

```txt
React Native :
- TanStack Query

Next.js :
- TanStack Query pour client-side server state
- fetch/server actions selon contexte

Flutter :
- Riverpod AsyncNotifier ou couche repository dédiée

Angular :
- RxJS services
- éventuellement TanStack Query Angular si validé plus tard
```

Règle :

```txt
Ne pas mélanger plusieurs solutions de server state dans le même core sans justification.
```

---

## 9.4 État global local

Recommandation :

```txt
React Native :
- Zustand

Next.js :
- Zustand pour état UI/client simple

Flutter :
- Riverpod

Angular :
- Signals ou NgRx selon complexité
```

Règle :

```txt
L’état global doit rester minimal.
Les données serveur doivent rester dans TanStack Query ou couche équivalente.
```

---

## 9.5 Formulaires et validation

Recommandation :

```txt
React Native :
- React Hook Form
- Zod

Next.js :
- React Hook Form
- Zod

Flutter :
- Form widgets natifs + validation dédiée
- possibilité de packages validés selon besoin

Angular :
- Reactive Forms
- Validators ou Zod-like si stratégie confirmée

NestJS :
- class-validator/class-transformer ou Zod selon choix du core

Spring Boot :
- Jakarta Bean Validation
```

Règle :

```txt
Les DTO/API contracts doivent être validés côté backend.
Les formulaires clients doivent valider avant soumission pour UX, mais ne remplacent jamais la validation backend.
```

---

## 9.6 Stockage local

Recommandation :

```txt
React Native :
- SecureStore ou Keychain pour données sensibles
- MMKV pour données rapides non sensibles
- AsyncStorage uniquement si besoin simple ou compatibilité

Flutter :
- Flutter Secure Storage pour données sensibles
- Hive ou Isar pour stockage local structuré

Web :
- cookies HttpOnly pour refresh token si possible
- localStorage uniquement pour données non sensibles
```

Règle :

```txt
Aucun refresh token sensible ne doit être stocké dans un stockage non sécurisé.
```

---

## 9.7 UI packages

Recommandation :

```txt
React Native :
- NativeWind ou design system maison basé tokens
- React Native Paper seulement si validé pour le projet
- Gorhom Bottom Sheet
- Reanimated
- Gesture Handler

Next.js :
- Tailwind CSS
- shadcn/ui
- Radix UI indirectement via shadcn/ui

Angular :
- Angular Material ou PrimeNG selon orientation enterprise

Flutter :
- Material 3 + composants maison
```

Règle :

```txt
Le UI Kit doit primer sur les librairies UI externes.
Les librairies UI externes doivent servir de base, pas remplacer l’identité Enistere.
```

---

## 9.8 Maps et géolocalisation

Recommandation cible :

```txt
Mobile :
- react-native-maps ou MapLibre selon besoin
- Expo Location pour géolocalisation si Expo compatible

Backend/Cloud :
- OSRM
- OpenStreetMap data
- PostGIS
- fallback Mapbox ou Google Directions si nécessaire
```

Règle :

```txt
La stratégie long terme doit éviter la dépendance totale à Google Maps pour les coûts.
```

---

## 9.9 Upload et médias

Recommandation :

```txt
React Native :
- fetch + FormData pour upload
- expo-image-picker
- expo-document-picker
- expo-image

Backend :
- MinIO/S3
- validation MIME
- taille maximale
- scan éventuel
- génération thumbnails si nécessaire
```

Règle :

```txt
Tout upload doit être validé côté backend.
Les types, tailles, extensions et permissions doivent être contrôlés.
```

---

## 9.10 Temps réel

Recommandation :

```txt
NestJS :
- WebSocket Gateway
- Socket.IO si besoin de rooms, acknowledgements, compatibilité

Mobile/Web :
- socket.io-client si backend Socket.IO
- WebSocket natif si besoin simple
```

Règle :

```txt
Le temps réel ne doit pas remplacer les APIs REST pour les opérations classiques.
Il doit être réservé aux événements live.
```

---

## 9.11 Observabilité

Recommandation :

```txt
Cloud :
- Prometheus
- Grafana
- Loki

Mobile/Web :
- Sentry ou équivalent pour erreurs production

API :
- logs structurés
- health checks
- metrics si possible
```

Règle :

```txt
Tout module critique doit produire des logs exploitables sans exposer de données sensibles.
```

---

## 9.12 Tests

Recommandation :

```txt
JavaScript/TypeScript :
- Jest ou Vitest selon core
- Testing Library pour UI

React Native :
- Jest
- React Native Testing Library

Next.js :
- Vitest ou Jest
- Playwright pour E2E si nécessaire

Angular :
- Jasmine/Karma ou Jest selon stratégie
- Cypress ou Playwright pour E2E

Flutter :
- flutter_test

Spring Boot :
- JUnit
- Testcontainers
```

Règle :

```txt
Le choix des outils de test doit rester stable par core.
```

---

## 10. Dépendances interdites ou déconseillées

Sont déconseillées :

```txt
- packages abandonnés
- packages non maintenus
- packages sans documentation
- packages avec licence incompatible
- packages trop lourds pour un petit besoin
- packages qui dupliquent une dépendance existante
- packages expérimentaux en production
- packages avec vulnérabilités critiques non corrigées
- packages obscurs pour des fonctionnalités sensibles
```

Sont interdites sans validation :

```txt
- dépendances de paiement
- dépendances d’authentification
- dépendances de chiffrement
- dépendances de stockage sensible
- dépendances cloud critiques
- dépendances qui exposent des données utilisateurs
```

---

## 11. Fichier DEPENDENCIES.md par core

Chaque core doit avoir un fichier :

```txt
DEPENDENCIES.md
```

Ce fichier doit contenir :

```txt
- nom de la dépendance
- rôle
- catégorie
- criticité
- raison du choix
- alternatives envisagées
- risques connus
- licence
- lien documentation
- date d’adoption
- responsable
```

Exemple :

```md
## @tanstack/react-query

Core : Mobile React Native  
Catégorie : Server state  
Criticité : Moyenne  
Rôle : Gestion du cache API, mutations, loading, retry  
Raison du choix : Standard robuste, maintenu, compatible React Native  
Alternatives : SWR, RTK Query  
Risques : Mauvaise séparation avec Zustand si mal utilisé  
Décision : Acceptée  
```

---

## 12. Versioning des dépendances

### 12.1 Règle générale

Les versions doivent être maîtrisées.

Éviter :

```txt
versions trop permissives
mises à jour automatiques non contrôlées
dépendances sans lockfile
```

---

### 12.2 Lockfiles obligatoires

Chaque core doit conserver son lockfile :

```txt
Node :
- package-lock.json
ou
- pnpm-lock.yaml
ou
- yarn.lock

Flutter :
- pubspec.lock pour applications

Java :
- pom.xml ou gradle.lockfile selon stratégie
```

---

### 12.3 Mises à jour

Les mises à jour sont classées :

```txt
PATCH : généralement faible risque
MINOR : risque moyen
MAJOR : risque élevé
```

Toute mise à jour majeure doit être analysée.

---

## 13. Politique de mise à jour

### 13.1 Mise à jour mensuelle

Objectif :

```txt
- sécurité
- vulnérabilités
- patchs critiques
```

---

### 13.2 Mise à jour trimestrielle

Objectif :

```txt
- frameworks
- dépendances UI
- outils build
- performances
- compatibilité
```

---

### 13.3 Mise à jour majeure

Une mise à jour majeure nécessite :

```txt
- analyse changelog
- tests
- branche dédiée
- notes de migration
- validation humaine
- release dédiée
```

---

## 14. Audit de sécurité

Chaque core doit prévoir un audit de dépendances.

Exemples :

```txt
Node :
- npm audit
- pnpm audit
- GitHub Dependabot

Java :
- OWASP Dependency Check
- Snyk éventuel
- GitHub Dependabot

Docker :
- scan images
- images officielles ou vérifiées

Flutter :
- dart pub outdated
- analyse des packages
```

---

## 15. Gestion des vulnérabilités

Les vulnérabilités sont classées :

```txt
Critical
High
Medium
Low
```

Règles :

```txt
Critical : correction prioritaire immédiate
High     : correction rapide
Medium   : correction planifiée
Low      : suivi dans backlog
```

Si aucune correction n’existe :

```txt
- documenter le risque
- chercher alternative
- isoler l’usage
- appliquer mitigation
- prévoir remplacement
```

---

## 16. Politique des images Docker

Règles :

```txt
- utiliser images officielles si possible
- éviter latest en production
- pin versions majeures ou précises
- documenter volumes
- documenter ports
- vérifier variables d’environnement
- éviter images obscures
- scanner images critiques
```

Exemples :

```txt
postgres:<version>
redis:<version>
minio/minio:<version>
traefik:<version>
osrm/osrm-backend:<version>
grafana/grafana:<version>
prom/prometheus:<version>
```

---

## 17. Gestion des APIs externes

Les APIs externes sont aussi des dépendances.

Exemples :

* Mapbox ;
* Google Maps ;
* Twilio ;
* providers SMS ;
* providers paiement ;
* providers mail ;
* Sentry ;
* services IA.

Avant adoption, vérifier :

```txt
- coût
- disponibilité
- documentation
- limitations
- localisation
- quotas
- politique de données
- stratégie fallback
- dépendance long terme
```

Règle :

```txt
Toute API payante ou critique doit avoir une stratégie de fallback ou de remplacement si possible.
```

---

## 18. Stratégie fallback

Pour les services critiques, définir un fallback.

Exemples :

```txt
Routing :
OSRM self-host → Mapbox Directions ou Google Directions

Email :
Provider principal → provider secondaire

SMS :
Provider local → provider international

Storage :
MinIO self-host → S3 compatible provider

Maps :
MapLibre/OSM → Mapbox/Google selon besoin
```

---

## 19. Suppression d’une dépendance

Une dépendance peut être supprimée si :

```txt
- elle n’est plus utilisée
- elle est abandonnée
- elle crée des conflits
- elle est trop lourde
- elle présente un risque sécurité
- elle est remplacée par une solution meilleure
```

Processus :

```txt
1. Identifier usages
2. Proposer alternative
3. Documenter impact
4. Refactorer progressivement
5. Tester
6. Supprimer
7. Mettre à jour DEPENDENCIES.md
8. Mettre à jour CHANGELOG.md
```

---

## 20. Dépréciation d’une dépendance

Avant suppression d’une dépendance structurante :

```txt
1. Marquer comme deprecated
2. Documenter alternative
3. Prévoir version de retrait
4. Ajouter note changelog
5. Supprimer en version majeure si breaking change
```

---

## 21. Gestion des dépendances IA

Les outils IA doivent aussi être gouvernés.

Exemples :

* Codex ;
* Claude Code ;
* ChatGPT ;
* vector database ;
* embeddings ;
* orchestration agents ;
* RAG tools.

Critères :

```txt
- coût
- confidentialité
- qualité
- intégration
- exportabilité
- dépendance fournisseur
- sécurité des données
```

Règle :

```txt
Ne jamais envoyer de secrets, clés privées ou données sensibles non maîtrisées à un outil IA.
```

---

## 22. Politique de licence

Avant adoption, vérifier la licence.

Licences généralement acceptables :

```txt
MIT
Apache-2.0
BSD
ISC
```

Licences à analyser avec prudence :

```txt
GPL
AGPL
LGPL
licences commerciales
licences propriétaires
```

Règle :

```txt
Toute licence restrictive ou commerciale doit être validée avant adoption.
```

---

## 23. Stratégie de minimisation

Chaque core doit rester minimal par défaut.

Principe :

```txt
Le starter doit inclure l’essentiel.
Les fonctionnalités avancées peuvent être optionnelles.
```

Exemples :

```txt
Mobile Core :
- auth et API obligatoires
- maps optionnel selon projet
- chat optionnel
- paiement optionnel

API Core :
- auth/users/roles obligatoires
- payment optionnel
- geospatial optionnel
- realtime optionnel

Cloud Core :
- PostgreSQL/Redis/Traefik obligatoires
- OSRM activable selon projet
- monitoring avancé activable selon environnement
```

---

## 24. Dépendances obligatoires vs optionnelles

Chaque core doit distinguer :

```txt
Required dependencies
Optional dependencies
Dev dependencies
Infrastructure dependencies
External service dependencies
```

Exemple Mobile React Native :

```txt
Required :
- expo-router
- tanstack query
- zustand
- zod
- react-hook-form

Optional :
- maps
- notifications
- camera
- bottom sheet
- carousel

Dev :
- eslint
- prettier
- jest
```

---

## 25. Règle anti-bloat

Une dépendance optionnelle ne doit pas être installée dans le starter principal si elle n’est pas nécessaire à tous les projets.

Approche recommandée :

```txt
starter minimal
+ modules activables
+ scripts d’installation optionnels
```

Exemple :

```txt
npm run add:maps
npm run add:notifications
npm run add:realtime
```

---

## 26. Registre global des dépendances

Créer un fichier central :

```txt
docs/DEPENDENCY_REGISTRY.md
```

Il liste :

```txt
- dépendances approuvées
- dépendances à éviter
- dépendances dépréciées
- dépendances remplacées
- dépendances critiques
```

---

## 27. Exemple de registre

```md
# Dependency Registry

## Approved

| Dependency | Core | Role | Status |
|---|---|---|---|
| TanStack Query | Mobile RN / Next.js | Server state | Approved |
| Zustand | Mobile RN / Next.js | Local state | Approved |
| Zod | Mobile RN / Next.js | Validation | Approved |
| Traefik | Cloud | Reverse proxy | Approved |
| OSRM | Cloud | Routing | Approved |

## Deprecated

| Dependency | Reason | Replacement |
|---|---|---|
| moment | Heavy / legacy | date-fns or dayjs |

## Forbidden without approval

| Dependency Type | Reason |
|---|---|
| Payment SDK | Security and compliance |
| Crypto library | High risk |
| Auth framework | Architecture impact |
```

---

## 28. Règles spécifiques à l’IA

Quand Codex ou Claude Code génère du code :

```txt
- il ne doit pas ajouter de dépendance sans justification
- il doit expliquer pourquoi une dépendance est nécessaire
- il doit proposer une alternative native si possible
- il doit mettre à jour DEPENDENCIES.md
- il doit signaler les risques
```

Prompt à inclure :

```txt
N’ajoute aucune dépendance sans justification explicite.
Si une dépendance est nécessaire, explique son rôle, son impact et son alternative possible.
Mets à jour le fichier DEPENDENCIES.md si une dépendance est ajoutée.
```

---

## 29. Checklist avant ajout d’une dépendance

```txt
- [ ] Le besoin est réel
- [ ] Il n’existe pas déjà une solution interne
- [ ] La dépendance est maintenue
- [ ] La documentation est correcte
- [ ] La licence est acceptable
- [ ] L’impact sécurité est acceptable
- [ ] L’impact performance est acceptable
- [ ] L’impact bundle/build est acceptable
- [ ] Les alternatives ont été comparées
- [ ] Le core owner valide
- [ ] DEPENDENCIES.md est mis à jour
- [ ] ADR ajouté si dépendance critique
```

---

## 30. Checklist de mise à jour

```txt
- [ ] Changelog de la dépendance lu
- [ ] Breaking changes identifiés
- [ ] Tests exécutés
- [ ] Build validé
- [ ] Documentation mise à jour si nécessaire
- [ ] Migration guide si nécessaire
- [ ] Version verrouillée
- [ ] Release note mise à jour
```

---

## 31. Checklist de suppression

```txt
- [ ] Usages identifiés
- [ ] Alternative prête
- [ ] Refactor effectué
- [ ] Tests OK
- [ ] Documentation mise à jour
- [ ] DEPENDENCIES.md mis à jour
- [ ] CHANGELOG.md mis à jour
- [ ] Breaking change documenté si applicable
```

---

## 32. Indicateurs de bonne gestion

Une bonne stratégie de dépendances se voit si :

```txt
- peu de dépendances inutiles
- dépendances maintenues
- mises à jour régulières
- faible dette de migration
- faible nombre de vulnérabilités
- builds stables
- documentation claire
- remplacement possible des services critiques
```

---

## 33. Anti-patterns interdits

Sont interdits :

```txt
- ajouter un package pour une fonction simple
- utiliser plusieurs librairies pour le même rôle
- installer une librairie UI complète pour un seul composant
- utiliser latest en production Docker
- ignorer une vulnérabilité critique
- ajouter un SDK payant sans analyse coût
- utiliser une dépendance abandonnée
- laisser une dépendance non documentée
- laisser l’IA ajouter des packages librement
```

---

## 34. Conclusion

La stratégie de dépendances est un pilier de la stabilité d’Enistere OS Foundation.

Elle permet de garder les cores simples, maintenables, sécurisés et évolutifs.

Le principe à retenir est :

```txt
Une dépendance doit être utile, justifiée, maintenue, documentée et remplaçable.
```

Ce document doit être appliqué avant tout ajout, mise à jour ou suppression de dépendance dans la fondation.
