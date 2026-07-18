# 08_STANDARDS.md

# Enistere OS Foundation — Standards Communs

## 1. Résumé exécutif

Ce document définit les standards communs applicables à Enistere OS Foundation.

Les standards communs servent à garantir que tous les cores, modules, composants, scripts, prompts, documentations et projets dérivés suivent une logique cohérente.

Ils couvrent :

- structure des dossiers ;
- nommage ;
- code ;
- configuration ;
- erreurs ;
- logs ;
- API ;
- UI ;
- tests ;
- documentation ;
- Git ;
- commits ;
- versioning ;
- sécurité ;
- prompts IA.

Ces standards doivent être appliqués par les développeurs humains, mais aussi par Codex, Claude Code ou tout autre agent IA utilisé pour générer ou modifier la fondation.

---

## 2. Objectif du document

Ce document répond aux questions suivantes :

```txt
Comment structurer les fichiers ?
Comment nommer les modules ?
Comment organiser le code ?
Comment documenter ?
Comment écrire les erreurs ?
Comment logger ?
Comment tester ?
Comment nommer les branches ?
Comment formater les commits ?
Comment garder une cohérence entre tous les cores ?
```

---

## 3. Principe général

Le standard principal est :

```txt id="p8c0cn"
Cohérence avant préférence personnelle.
```

Chaque core peut avoir ses spécificités, mais doit respecter une logique commune.

---

## 4. Règles transversales

Tous les cores doivent respecter les règles suivantes :

```txt id="ev57t8"
- structure claire
- nommage explicite
- configuration documentée
- secrets exclus du Git
- README obligatoire
- tests pour modules critiques
- erreurs standardisées
- logs exploitables
- dépendances justifiées
- changelog maintenu
- documentation à jour
```

---

# PARTIE 1 — STRUCTURE

## 5. Structure du repository principal

Structure cible :

```txt id="3be0ui"
enistere-os-foundation/
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── CODEOWNERS
├── .github/
├── strategy/
├── docs/
├── cores/
├── factory/ai/prompts/
├── tools/
├── templates/
└── examples/
```

---

## 6. Structure standard d’un core

Chaque core doit suivre la base suivante :

```txt id="o7gdra"
cores/<core-name>/
├── README.md
├── CORE_SPECIFICATION.md
├── ARCHITECTURE.md
├── INSTALLATION.md
├── USAGE.md
├── TESTING.md
├── SECURITY.md
├── DEPENDENCIES.md
├── ROADMAP.md
├── CHANGELOG.md
├── docs/
├── examples/
├── templates/
└── src/ ou infrastructure/
```

---

## 7. Structure documentation centrale

```txt id="6ylijm"
docs/
├── adr/
├── guides/
├── checklists/
├── runbooks/
├── onboarding/
├── decisions/
└── glossary/
```

---

## 8. Structure prompts

```txt id="p5d5oa"
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

# PARTIE 2 — NOMMAGE

## 9. Nommage des repositories

Format :

```txt id="qmu4gn"
enistere-<domain>-<technology>
```

Exemples :

```txt id="no5zhx"
enistere-os-foundation
enistere-core-api-nestjs
enistere-core-mobile-react-native
enistere-core-web-nextjs
enistere-core-cloud
```

Pour projets dérivés :

```txt id="kfcsby"
kivvoo-api
kivvoo-mobile
rfashion-seller-mobile
bailo-web
vox-pulse-api
```

---

## 10. Nommage des cores

Format :

```txt id="msjd2i"
<domain>-<technology>
```

Exemples :

```txt id="sxep7p"
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
```

---

## 11. Nommage des branches

Format :

```txt id="1kr80z"
<type>/<core>/<short-description>
```

Types :

```txt id="gqv81j"
feature
fix
docs
chore
refactor
test
security
ci
```

Exemples :

```txt id="6b7ifp"
feature/api-nestjs/auth-module
feature/mobile-react-native/upload-client
docs/cloud/osrm-setup
security/api-nestjs/rate-limit-login
```

---

## 12. Nommage des commits

Utiliser Conventional Commits.

Format :

```txt id="st6vwl"
type(scope): message
```

Exemples :

```txt id="x4cibf"
feat(api-nestjs): add auth module
fix(mobile-react-native): correct upload client
docs(cloud): document osrm setup
security(api-nestjs): add rate limiting on auth endpoints
```

Types autorisés :

```txt id="8x9rf7"
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
build
release
```

---

## 13. Nommage des fichiers Markdown

Format :

```txt id="fxjzz3"
UPPER_SNAKE_CASE.md pour documents stratégiques
kebab-case.md pour guides et docs secondaires
```

Exemples :

```txt id="igko2d"
01_VISION_FINAL.md
02_GOVERNANCE.md
CORE_SPECIFICATION.md
osrm-setup-guide.md
api-auth-guide.md
```

---

## 14. Nommage des ADR

Format :

```txt id="zsd93q"
ADR-XXX-short-title.md
```

Exemples :

```txt id="41t5rm"
ADR-001-git-monorepo-hybrid.md
ADR-002-use-osrm.md
ADR-003-use-tanstack-query.md
```

---

# PARTIE 3 — STANDARDS CODE

## 15. Standards TypeScript

Applicable à :

* API Core NestJS ;
* Mobile Core React Native ;
* Web Core Next.js ;
* UI Kit React/React Native ;
* IA tooling Node si applicable.

Règles :

```txt id="lx16v0"
- TypeScript strict recommandé
- éviter any sauf justification
- types explicites pour APIs publiques
- DTO séparés
- services séparés
- pas de logique métier dans composants UI
- pas de duplication inutile
- erreurs typées si possible
```

---

## 16. Standards Java

Applicable à API Core Spring Boot.

Règles :

```txt id="rll1nf"
- packages organisés par domaine
- DTO séparés des entités
- services dédiés
- controllers légers
- validation avec Jakarta Bean Validation
- exceptions centralisées
- tests unitaires services
- tests intégration contrôleurs si nécessaire
```

---

## 17. Standards Dart/Flutter

Applicable à Mobile Core Flutter.

Règles :

```txt id="yt568o"
- architecture feature-first
- Riverpod pour état
- go_router pour navigation
- models immutables si possible
- séparation data/domain/presentation si projet complexe
- widgets réutilisables documentés
- thèmes centralisés
```

---

## 18. Standards React Native

Règles :

```txt id="hscwmx"
- composants fonctionnels
- hooks dédiés
- pas d’appel API direct dans les composants
- API via services/hooks TanStack Query
- formulaires via React Hook Form
- validation via Zod
- tokens sécurisés hors stockage non sécurisé
- upload fichier via fetch lorsque multipart/form-data
```

---

## 19. Standards Next.js

Règles :

```txt id="otraz3"
- App Router
- composants serveur si pertinent
- composants client uniquement si nécessaire
- validation côté serveur et client si besoin
- séparation UI / data / features
- SEO documenté pour pages publiques
- routes protégées clairement
```

---

## 20. Standards Angular

Règles :

```txt id="4lnhql"
- standalone components
- services dédiés
- interceptors HTTP
- guards pour routes protégées
- Reactive Forms
- composants partagés
- structure feature-first
- RxJS maîtrisé
```

---

# PARTIE 4 — ARCHITECTURE PAR CORE

## 21. API Core NestJS

Structure recommandée :

```txt id="68bc18"
src/
├── main.ts
├── app.module.ts
├── config/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── utils/
├── infrastructure/
│   ├── database/
│   ├── cache/
│   ├── queue/
│   ├── storage/
│   ├── mail/
│   └── monitoring/
└── modules/
    ├── auth/
    ├── users/
    ├── roles/
    ├── permissions/
    ├── files/
    ├── notifications/
    └── audit/
```

---

## 22. Mobile Core React Native

Structure recommandée :

```txt id="3si7zk"
src/
├── app/
├── core/
│   ├── api/
│   ├── auth/
│   ├── config/
│   ├── errors/
│   ├── query/
│   ├── storage/
│   ├── upload/
│   ├── realtime/
│   └── maps/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── theme/
│   ├── utils/
│   └── constants/
└── features/
    ├── auth/
    ├── home/
    ├── profile/
    ├── notifications/
    └── settings/
```

---

## 23. Web Core Next.js

Structure recommandée :

```txt id="lso6oi"
src/
├── app/
├── core/
│   ├── api/
│   ├── auth/
│   ├── config/
│   ├── query/
│   └── errors/
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── theme/
└── features/
    ├── auth/
    ├── dashboard/
    ├── profile/
    └── settings/
```

---

## 24. Cloud Core

Structure recommandée :

```txt id="0e3mn6"
infrastructure/
├── docker/
├── traefik/
├── postgres/
├── redis/
├── minio/
├── osrm/
├── monitoring/
│   ├── prometheus/
│   ├── grafana/
│   └── loki/
├── backups/
├── scripts/
├── security/
└── ci-cd/
```

---

## 25. UI Kit

Structure recommandée :

```txt id="nrjv6d"
ui-kit/
├── tokens/
├── foundations/
├── components/
│   ├── buttons/
│   ├── inputs/
│   ├── cards/
│   ├── modals/
│   ├── feedback/
│   ├── navigation/
│   └── layout/
├── patterns/
├── guidelines/
└── examples/
```

---

# PARTIE 5 — CONFIGURATION

## 26. Variables d’environnement

Chaque core doit fournir :

```txt id="dwmtv4"
.env.example
```

Règles :

```txt id="pjb6pf"
- jamais de secret réel
- valeurs exemples non sensibles
- commentaires explicatifs si nécessaire
- validation des variables au démarrage si possible
```

---

## 27. Environnements standards

Environnements :

```txt id="bynnl8"
local
development
staging
production
```

Chaque environnement doit préciser :

```txt id="ocbkpo"
- API URL
- database URL
- storage config
- redis config
- auth config
- logs level
- feature flags si nécessaire
```

---

## 28. Nommage des variables

Format :

```txt id="douuhu"
UPPER_SNAKE_CASE
```

Exemples :

```txt id="91lfgg"
DATABASE_URL
REDIS_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
MINIO_ENDPOINT
API_BASE_URL
EXPO_PUBLIC_API_URL
```

Rappel :

```txt id="q6mgqh"
Toute variable EXPO_PUBLIC_* est exposée au client mobile.
Elle ne doit contenir aucun secret.
```

---

# PARTIE 6 — API STANDARDS

## 29. Versioning API

Format recommandé :

```txt id="2mfxlf"
/api/v1
/api/v2
```

---

## 30. Format de réponse API

Réponse succès :

```json id="vtemxq"
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "meta": {}
}
```

Réponse erreur :

```json id="9t72po"
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "details": []
}
```

---

## 31. Pagination

Format recommandé :

```json id="5sd5qv"
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 32. Nommage des endpoints

Règles :

```txt id="rps7qa"
- ressources au pluriel
- kebab-case si nécessaire
- verbes HTTP appropriés
```

Exemples :

```txt id="68a6hz"
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/files/upload
```

---

## 33. Codes HTTP

Standards :

```txt id="hh4o3b"
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
```

---

# PARTIE 7 — ERREURS ET LOGS

## 34. Codes d’erreur

Format :

```txt id="5ybsqe"
DOMAIN_ERROR_REASON
```

Exemples :

```txt id="kv1ihq"
AUTH_INVALID_CREDENTIALS
AUTH_TOKEN_EXPIRED
USER_NOT_FOUND
USER_EMAIL_ALREADY_EXISTS
UPLOAD_FILE_TOO_LARGE
PAYMENT_FAILED
PERMISSION_DENIED
VALIDATION_ERROR
INTERNAL_ERROR
```

---

## 35. Logs

Les logs doivent être :

```txt id="4ook2k"
- lisibles
- structurés
- sans secrets
- utiles au debug
- exploitables en monitoring
```

Champs recommandés :

```txt id="qyv52m"
timestamp
level
requestId
userId
action
resource
statusCode
durationMs
message
```

---

## 36. Niveaux de logs

```txt id="rp7i0a"
debug
info
warn
error
fatal
```

Règles :

```txt id="wxlvma"
debug : développement
info  : événements normaux
warn  : comportement anormal non bloquant
error : erreur applicative
fatal : erreur critique système
```

---

# PARTIE 8 — UI/UX STANDARDS

## 37. États UI obligatoires

Tout écran important doit gérer :

```txt id="4u30xf"
- loading
- empty
- error
- success
- offline si applicable
- unauthorized si applicable
```

---

## 38. Composants UI

Un composant UI réutilisable doit prévoir :

```txt id="ou7ybx"
- variants
- sizes
- disabled state
- loading state
- error state si applicable
- accessibilité
- documentation
- exemples
```

---

## 39. Design tokens

Les styles doivent venir des tokens :

```txt id="pp8awc"
colors
typography
spacing
radius
shadows
z-index
motion
```

Éviter les valeurs magiques non documentées.

---

## 40. Accessibilité

Standards :

```txt id="zmdtyt"
- contrastes lisibles
- labels accessibles
- tailles tactiles suffisantes
- navigation clavier si web
- texte alternatif si image informative
- états focus visibles si web
```

---

# PARTIE 9 — TESTING STANDARDS

## 41. Types de tests

```txt id="wwa0z3"
unit tests
integration tests
end-to-end tests
component tests
security checks
visual checks si UI critique
```

---

## 42. Tests obligatoires

Doivent être testés en priorité :

```txt id="oog7hp"
- auth
- permissions
- validation DTO
- upload
- paiement
- services critiques
- composants UI critiques
- scripts cloud critiques
```

---

## 43. Convention de fichiers tests

Exemples :

```txt id="7ji1oz"
auth.service.spec.ts
auth.controller.spec.ts
AppButton.test.tsx
user.repository.test.ts
UserServiceTest.java
auth_flow_test.dart
```

---

# PARTIE 10 — DOCUMENTATION STANDARDS

## 44. Documentation minimale d’un core

Chaque core doit contenir :

```txt id="qj0qlw"
README.md
CORE_SPECIFICATION.md
ARCHITECTURE.md
INSTALLATION.md
USAGE.md
TESTING.md
SECURITY.md
DEPENDENCIES.md
CHANGELOG.md
```

---

## 45. Documentation minimale d’un module

Chaque module critique doit documenter :

```txt id="xqvu0q"
- rôle
- installation/configuration si nécessaire
- usage
- variables
- exemples
- erreurs possibles
- tests
- limites
```

---

## 46. Langue de documentation

Langue principale :

```txt id="8jho68"
Français
```

Langue secondaire possible :

```txt id="0g0142"
Anglais pour noms techniques, APIs, code comments si nécessaire
```

---

# PARTIE 11 — VERSIONING ET RELEASE

## 47. Versioning

Utiliser SemVer :

```txt id="qveul8"
MAJOR.MINOR.PATCH
```

Règles :

```txt id="vifvt0"
PATCH : correction
MINOR : fonctionnalité compatible
MAJOR : breaking change
```

---

## 48. Changelog

Chaque core doit avoir :

```txt id="lpaery"
CHANGELOG.md
```

Format recommandé :

```md id="ljnfg4"
## [0.1.0] - YYYY-MM-DD

### Added
### Changed
### Fixed
### Security
### Deprecated
### Removed
```

---

# PARTIE 12 — IA STANDARDS

## 49. Standards prompts IA

Tout prompt IA doit contenir :

```txt id="3k43lq"
- contexte
- objectif
- périmètre
- contraintes
- livrables
- tests attendus
- documentation attendue
- interdictions
```

---

## 50. Interdictions IA

L’IA ne doit pas :

```txt id="nw7vos"
- ajouter dépendance sans justification
- modifier architecture globale sans demande
- générer un core entier sans découpage
- manipuler secrets
- ignorer documentation
- ignorer tests
- créer breaking change silencieux
```

---

# PARTIE 13 — CHECKLIST GLOBALE

## 51. Checklist standard avant validation

```txt id="65t4y2"
- [ ] Structure respectée
- [ ] Nommage conforme
- [ ] Code lisible
- [ ] Types corrects
- [ ] Erreurs gérées
- [ ] Logs sans secrets
- [ ] Tests nécessaires présents
- [ ] Documentation mise à jour
- [ ] Dépendances justifiées
- [ ] Sécurité vérifiée
- [ ] Changelog mis à jour si nécessaire
```

---

## 52. Anti-patterns interdits

```txt id="an9q10"
- structure improvisée
- nommage incohérent
- code métier dans composant UI
- appels API directs partout
- secrets dans Git
- logs sensibles
- dépendance non documentée
- composant sans état loading/error
- module critique sans test
- documentation absente
- génération IA hors périmètre
```

---

## 53. Conclusion

Les standards communs sont essentiels pour faire d’Enistere OS Foundation une plateforme cohérente, maintenable et évolutive.

Ils doivent être appliqués à chaque core, chaque module, chaque composant, chaque script et chaque prompt IA.

Le principe final est :

```txt id="ctofc3"
Ce qui est standardisé devient réutilisable.
Ce qui est réutilisable accélère les projets.
```
