# Web Core Next.js — Spécification du Core

## 1. Résumé exécutif

Le **Web Core Next.js** définit le socle web Next.js de référence pour les futures interfaces Enistere : landing pages, dashboards, backoffices, portails clients, SaaS, marketplaces, plateformes immobilières, outils internes, interfaces admin et espaces partenaires.

Il doit fournir une base modulaire, sécurisée, accessible, performante et réutilisable, sans imposer de logique métier propre à un projet dérivé.

Cette spécification est documentaire. Elle ne crée pas de projet Next.js, `package.json`, dossier `src/`, composant réel, route réelle, dépendance ou code applicatif.

## 2. Rôle du core

Le rôle du Web Core Next.js est de cadrer la base commune des applications web Enistere.

Il doit :

- standardiser l'architecture Next.js App Router ;
- fournir des conventions pour layouts, routes, auth, API, formulaires et UI ;
- sécuriser sessions, cookies, permissions et variables publiques ;
- préparer les usages landing page, SaaS, dashboard et backoffice ;
- assurer l'intégration avec API Core NestJS, Cloud Core, UI Kit, IA Core, Quality Core et Docs Core ;
- permettre une montée progressive vers un starter production-ready.

## 3. Objectifs du Web Core Next.js

- Fournir un starter web minimal puis production-ready à terme.
- Utiliser Next.js, React, TypeScript et App Router comme base cible.
- Prévoir Tailwind CSS, shadcn/ui et Radix UI comme technologies cibles possibles.
- Standardiser auth flow, routing protégé, layouts et session handling.
- Standardiser API client, erreurs, server state, cache client et état local.
- Standardiser React Hook Form et Zod pour formulaires et validation.
- Prévoir SEO pour pages publiques et non-indexation pour dashboards/backoffices.
- Préparer accessibilité, performance, observabilité, tests et qualité.
- Rester générique, sans logique métier spécifique à Kivvoo, Bailo, RFashion, Vox Pulse, CIVIS ID ou tout autre projet dérivé.

## 4. Problèmes à résoudre

Le core doit éviter :

- une structure Next.js différente à chaque projet ;
- des layouts dashboards dupliqués ;
- une gestion auth incohérente ;
- des tokens stockés dans `localStorage` ;
- des appels API dispersés ;
- des formulaires non standardisés ;
- des états loading, empty, error ou success incohérents ;
- des composants UI non réutilisables ;
- des pages publiques sans SEO ;
- des dashboards indexables par erreur ;
- des tests absents sur auth, formulaires, API et routes protégées.

## 5. Périmètre fonctionnel

Le Web Core Next.js couvre :

- structure Next.js App Router ;
- layouts standards ;
- routing protégé ;
- auth flow ;
- session handling ;
- API client ;
- gestion erreurs API ;
- TanStack Query ou stratégie server state à cadrer ;
- state local minimal ;
- React Hook Form ;
- Zod ;
- UI components minimal ;
- theme system ;
- design tokens ;
- loading states ;
- empty states ;
- error states ;
- confirmation dialogs ;
- toast feedback ;
- environment config ;
- constants ;
- logger minimal ;
- SEO baseline ;
- accessibility baseline ;
- testing setup futur.

## 6. Hors périmètre

Le core ne doit pas contenir :

- logique métier projet ;
- pages complètes spécifiques à un produit ;
- projet Next.js réel dans cette mission ;
- route réelle dans cette mission ;
- composant réel dans cette mission ;
- dépendance installée ;
- secret ou clé API ;
- choix définitif TanStack Query vs stratégie server-side sans ADR si structurant ;
- choix définitif fetch vs Axios sans ADR si structurant ;
- choix définitif Sentry vs alternative sans ADR si structurant ;
- choix définitif Playwright vs Cypress sans ADR si structurant.

## 7. Architecture cible

L'architecture cible doit séparer :

- app routes ;
- layouts ;
- features ;
- services API ;
- server state ;
- état local ;
- composants UI ;
- formulaires ;
- validation ;
- permissions ;
- configuration ;
- styles et tokens.

Principes :

- App Router ;
- TypeScript strict recommandé ;
- séparation server/client components ;
- server state dans TanStack Query ou stratégie server-side validée ;
- état local UI dans Zustand si nécessaire ;
- composants génériques ;
- auth et permissions centralisées ;
- variables publiques strictement limitées à `NEXT_PUBLIC_*`.

## 8. Structure cible du futur starter

Structure indicative du futur starter :

```txt
cores/web-nextjs/
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
└── starter/
    ├── app/
    │   ├── (public)/
    │   ├── (auth)/
    │   ├── (dashboard)/
    │   ├── api/
    │   ├── layout.tsx
    │   └── not-found.tsx
    ├── src/
    │   ├── core/
    │   │   ├── api/
    │   │   ├── auth/
    │   │   ├── config/
    │   │   ├── constants/
    │   │   ├── errors/
    │   │   ├── forms/
    │   │   ├── logger/
    │   │   ├── permissions/
    │   │   ├── query/
    │   │   ├── seo/
    │   │   └── theme/
    │   ├── features/
    │   ├── shared/
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   └── utils/
    │   └── ui/
    └── tests/
```

Cette structure est cible. Elle ne doit pas être créée pendant cette mission.

## 9. Modules obligatoires

Le futur starter doit prévoir :

- structure Next.js App Router ;
- layouts standards ;
- routing protégé ;
- auth flow ;
- session handling ;
- API client ;
- gestion erreurs API ;
- TanStack Query ou stratégie server state à cadrer ;
- state local minimal ;
- React Hook Form ;
- Zod ;
- UI components minimal ;
- theme system ;
- design tokens ;
- loading states ;
- empty states ;
- error states ;
- confirmation dialogs ;
- toast feedback ;
- environment config ;
- constants ;
- logger minimal ;
- SEO baseline ;
- accessibility baseline ;
- testing setup futur.

## 10. Modules optionnels

Ces modules doivent être activables selon projet :

- dashboard layout avancé ;
- admin layout ;
- data table avancée ;
- charts ;
- maps web ;
- upload avancé ;
- file manager ;
- notifications web ;
- realtime module ;
- i18n ;
- CMS/content module ;
- analytics ;
- payment integration ;
- role management UI ;
- audit logs UI ;
- report/export module ;
- AI assistant widget ;
- command palette ;
- onboarding module.

## 11. Modules futurs

Les modules futurs peuvent inclure :

- multi-tenant web ;
- feature flags ;
- AB testing ;
- design token sync ;
- generated API client depuis OpenAPI ;
- advanced permissions UI ;
- content preview ;
- audit dashboard ;
- workflow builder ;
- embedded AI copilot.

Ces modules nécessiteront validation de roadmap et ADR si leur impact est structurant.

## 12. Standards Next.js

Le core doit respecter :

- App Router ;
- route groups ;
- layouts explicites ;
- server components par défaut si adaptés ;
- client components uniquement si nécessaire ;
- metadata pour pages publiques ;
- non-indexation des dashboards/backoffices ;
- middleware si nécessaire ;
- gestion des erreurs et not-found ;
- séparation configuration publique/privée.

## 13. Standards React

Le core doit prévoir :

- composants fonctionnels ;
- hooks dédiés ;
- pas d'appel API dispersé dans les composants ;
- composants UI sans logique métier projet ;
- props typées ;
- états contrôlés ;
- rendu conditionnel lisible ;
- accessibilité intégrée.

## 14. Standards TypeScript

Le core doit prévoir :

- TypeScript strict recommandé ;
- types explicites pour API publiques ;
- modèles de payload API typés ;
- erreurs typées si possible ;
- schémas Zod ;
- éviter `any` sauf justification ;
- séparation types API, UI et domaine ;
- documentation des conventions.

## 15. Standards sécurité web

Le core doit appliquer :

- cookies HttpOnly Secure SameSite pour refresh/session si retenu ;
- access token en mémoire ou stratégie server-side selon architecture ;
- protection routes côté serveur si possible ;
- middleware Next.js si nécessaire ;
- RBAC et permissions alignés avec API Core ;
- CSRF si cookies utilisés ;
- vérification `Origin` / `Referer` pour actions sensibles si applicable ;
- protection XSS ;
- CSP à prévoir ;
- CORS côté API ;
- `localStorage` interdit pour tokens sensibles ;
- erreurs sans fuite de données sensibles ;
- logs sans secrets ;
- variables `NEXT_PUBLIC_*` uniquement pour valeurs publiques.

## 16. Routing et App Router

Le routing doit utiliser App Router.

Il doit prévoir :

- routes publiques ;
- routes auth ;
- routes dashboard ;
- routes admin si activées ;
- route groups ;
- layouts imbriqués ;
- not-found ;
- error boundaries ;
- loading UI ;
- middleware pour protection si nécessaire.

## 17. Layouts et templates

Le core doit prévoir :

- layout public ;
- layout auth ;
- layout dashboard ;
- layout admin optionnel ;
- templates de page ;
- shell application ;
- responsive design ;
- zones header/sidebar/content ;
- intégration UI Kit.

## 18. Authentification web

L'auth web doit prévoir :

- login ;
- logout ;
- register si activé selon projet ;
- refresh/session ;
- récupération utilisateur courant ;
- session expirée ;
- redirection après login ;
- protection route ;
- compatibilité API Core NestJS.

Auth.js ou auth custom peuvent être envisagés, sans choix définitif à ce stade.

## 19. Gestion session et cookies

La stratégie session doit prévoir :

- cookie HttpOnly pour refresh/session si retenu ;
- Secure en production ;
- SameSite Lax ou Strict selon besoin ;
- expiration ;
- rotation si supportée ;
- invalidation côté serveur ;
- suppression au logout ;
- protection CSRF si cookies utilisés ;
- vérification `Origin` / `Referer` pour actions sensibles si applicable.

Les tokens sensibles ne doivent pas être stockés dans `localStorage`.

## 20. Protection des routes

La protection des routes doit être faite côté serveur si possible.

Elle doit couvrir :

- middleware Next.js si adapté ;
- server-side checks ;
- guards de layout ;
- redirection auth ;
- pages interdites ;
- fallback client uniquement en complément ;
- non-indexation des zones privées.

## 21. Autorisation, rôles et permissions

Le core doit prévoir :

- RBAC ;
- permissions fines ;
- alignement avec API Core NestJS ;
- contrôle d'affichage UI ;
- interdiction d'action non autorisée côté UI ;
- rappel que l'autorisation backend reste obligatoire ;
- composants ou hooks permission génériques.

## 22. Intégration API

Le core doit fournir un client HTTP centralisé.

Il doit couvrir :

- base URL par environnement ;
- séparation appels serveur/client ;
- gestion erreurs standard API ;
- typage des réponses ;
- refresh contrôlé si applicable ;
- retries contrôlés ;
- timeout ;
- wrappers ou intercepteurs applicatifs ;
- compatibilité future avec génération client OpenAPI ;
- mutations ;
- invalidation du cache ;
- pagination.

Le choix fetch vs Axios doit être documenté par ADR si structurant.

## 23. Server state et cache client

TanStack Query est la cible possible pour le server state côté client.

Le core doit définir :

- query client ;
- clés de requêtes ;
- invalidation ;
- retry ;
- stale time ;
- cache time ;
- mutations ;
- pagination ;
- optimistic update si nécessaire ;
- séparation avec stratégie server-side.

Le choix TanStack Query vs stratégie server-side doit être documenté par ADR si structurant.

## 24. Gestion état local

Zustand peut être utilisé pour l'état local simple.

Usages :

- état UI ;
- filtres temporaires ;
- sidebar ouverte/fermée ;
- modals ;
- préférences non sensibles ;
- command palette.

Les données serveur doivent rester dans TanStack Query ou une stratégie server-side validée.

## 25. Formulaires et validation

Le core doit prévoir :

- React Hook Form ;
- Zod ;
- schémas de validation ;
- messages d'erreur lisibles ;
- validation client UX ;
- validation backend obligatoire ;
- composants form compatibles UI Kit ;
- accessibilité des erreurs.

## 26. Gestion des erreurs

Le core doit standardiser :

- erreurs API ;
- erreurs réseau ;
- erreurs auth ;
- erreurs permissions ;
- erreurs validation ;
- erreurs upload ;
- erreurs server components si applicable ;
- erreurs inconnues.

Les erreurs affichées doivent rester utiles sans exposer d'information sensible.

## 27. Gestion loading / empty / error / success

Le core doit prévoir des patterns pour :

- loading initial ;
- loading mutation ;
- loading route ;
- empty state ;
- error state ;
- success state ;
- retry ;
- skeleton ou placeholder si validé ;
- feedback utilisateur cohérent.

Ces états doivent être compatibles UI Kit.

## 28. UI Kit web

Le Web Core doit consommer ou préparer le futur UI Kit web.

Il doit prévoir :

- composants de base ;
- états ;
- responsive design ;
- thème ;
- dark mode si validé ;
- accessibilité ;
- cohérence web/mobile ;
- composition dashboard.

Le core ne doit pas créer une identité visuelle spécifique projet.

## 29. Design system et tokens

Le core doit cadrer :

- couleurs ;
- typographies ;
- spacing ;
- radius ;
- ombres ;
- breakpoints ;
- composants ;
- états interactifs ;
- tokens partagés avec UI Kit.

## 30. Composants de base

Les composants minimaux futurs peuvent inclure :

- Button ;
- Link ;
- Input ;
- Textarea ;
- Select ;
- Checkbox ;
- Switch ;
- Card ;
- Badge ;
- Alert ;
- Toast ;
- Dialog ;
- Drawer ;
- Table ;
- Pagination ;
- EmptyState ;
- ErrorState ;
- Loader.

Ces composants doivent rester génériques.

## 31. Navigation, sidebar, header et breadcrumbs

Le core doit prévoir :

- navigation principale ;
- sidebar ;
- header ;
- breadcrumbs ;
- menu utilisateur ;
- navigation mobile responsive ;
- états actifs ;
- accès rapide aux actions.

## 32. Tableaux, filtres et pagination

Le core doit cadrer :

- table simple ;
- data table avancée optionnelle ;
- filtres ;
- recherche ;
- tri ;
- pagination ;
- empty state ;
- loading state ;
- sélection de lignes si nécessaire ;
- export si module activé.

## 33. Modals, drawers et confirmations

Le core doit prévoir :

- modals ;
- drawers ;
- confirmations ;
- alert dialogs ;
- fermeture contrôlée ;
- accessibilité ;
- gestion focus ;
- feedback après action.

## 34. Toasts et feedback utilisateur

Le core doit prévoir :

- success toast ;
- error toast ;
- warning toast ;
- info toast ;
- messages courts ;
- absence de données sensibles ;
- cohérence UI Kit.

## 35. Upload fichiers

La stratégie upload doit couvrir :

- upload via formulaire web ;
- validation côté client ;
- validation backend obligatoire ;
- taille maximale ;
- types de fichiers ;
- progression upload si nécessaire ;
- erreurs réseau ;
- intégration avec API Core UploadModule ;
- URLs signées si utilisées ;
- suppression metadata sensible si nécessaire.

## 36. SEO et metadata

Le core doit distinguer :

- pages publiques avec SEO fort ;
- dashboards et backoffices non indexables ;
- metadata ;
- Open Graph ;
- sitemap si projet public ;
- robots ;
- canonical si nécessaire ;
- performance Core Web Vitals.

## 37. Internationalisation éventuelle

L'i18n est optionnelle.

Elle peut couvrir :

- dictionnaires ;
- routing localisé ;
- formats date/nombre ;
- messages d'erreur ;
- SEO multilingue si projet public ;
- fallback langue.

Le choix de librairie i18n doit être validé si structurant.

## 38. Accessibilité

Le core doit prévoir :

- labels accessibles ;
- tailles et contrastes ;
- navigation clavier ;
- focus visible ;
- lecteurs d'écran ;
- erreurs de formulaire accessibles ;
- modals accessibles ;
- tables lisibles ;
- landmarks.

## 39. Performance

Le core doit cadrer :

- Core Web Vitals ;
- rendu serveur si pertinent ;
- réduction JavaScript client ;
- code splitting ;
- images optimisées ;
- pagination ;
- cache ;
- avoiding re-renders ;
- dashboards performants ;
- bundle surveillé.

## 40. Images et médias

Le core doit prévoir :

- optimisation images ;
- formats modernes ;
- tailles responsives ;
- alt text ;
- lazy loading ;
- placeholder si nécessaire ;
- restrictions upload si média utilisateur ;
- intégration Cloud/API si stockage externe.

## 41. Configuration environnement

Le core doit prévoir :

- environnements local, staging, production ;
- base URL API ;
- variables serveur ;
- variables publiques `NEXT_PUBLIC_*` uniquement publiques ;
- absence de secrets dans le client ;
- constantes globales ;
- documentation des variables ;
- validation de configuration.

## 42. Build et déploiement

Le core doit cadrer :

- build local ;
- build production ;
- variables par environnement ;
- intégration Cloud Core ;
- déploiement via CI/CD futur ;
- rollback ;
- release notes ;
- checks avant release.

Aucun build réel n'est créé dans cette mission.

## 43. Observabilité web

Le core doit prévoir :

- logger minimal ;
- logs sans secrets ;
- capture erreurs critique ;
- monitoring erreurs ;
- breadcrumbs non sensibles ;
- environnement attaché aux erreurs ;
- désactivation ou réduction logs en production ;
- reporting côté client et serveur si validé.

Sentry ou une alternative pourra être retenu par ADR si l'observabilité devient structurante.

## 44. Tests attendus

Le core doit prévoir :

- tests composants ;
- tests hooks ;
- tests formulaires ;
- tests auth ;
- tests routes protégées ;
- tests permissions UI ;
- tests API client ;
- tests upload ;
- tests états loading/error/empty ;
- tests E2E si nécessaire ;
- tests accessibilité si possible.

Playwright ou Cypress pourront être tranchés par ADR si le choix devient structurant.

## 45. Qualité, lint et format

Le futur starter doit prévoir :

- lint ;
- format ;
- typecheck ;
- tests ;
- conventions imports ;
- conventions de nommage ;
- vérification dépendances ;
- checks CI futurs ;
- documentation des commandes qualité.

## 46. Sécurité des dépendances

Toute dépendance doit être justifiée.

Règles :

- éviter dépendances gadgets ;
- éviter doublons ;
- analyser maintenance, compatibilité Next.js, licence et sécurité ;
- ADR pour state strategy, HTTP client, E2E, observabilité, charts ou maps si structurant ;
- ne pas ajouter de dépendance sans validation ;
- documenter les alternatives.

## 47. Intégration avec API Core NestJS

Le Web Core Next.js doit s'intégrer avec API Core NestJS pour :

- auth ;
- refresh/session ;
- rôles et permissions ;
- endpoints dashboard/backoffice ;
- upload fichiers ;
- erreurs standardisées ;
- pagination ;
- OpenAPI si génération client validée ;
- notifications ;
- audit logs UI si activé.

## 48. Intégration avec Cloud Core

Le Web Core Next.js doit s'intégrer avec Cloud Core pour :

- hébergement Next.js ;
- Traefik ;
- domaines ;
- SSL/TLS ;
- variables d'environnement ;
- logs ;
- health checks ;
- CI/CD future ;
- rollback ;
- monitoring.
- absence de secrets dans le bundle client.

## 49. Intégration avec Mobile Core React Native

Le Web Core Next.js doit rester cohérent avec Mobile Core React Native pour :

- contrats API partagés ;
- modèles d'erreurs ;
- permissions visibles côté UI ;
- design tokens ;
- états loading, empty, error et success ;
- conventions OpenAPI si génération client validée ;
- cohérence UX entre web et mobile.

## 50. Intégration avec UI Kit

Le core doit être compatible avec UI Kit :

- design tokens ;
- composants web ;
- thème ;
- états standardisés ;
- accessibilité ;
- dark mode si validé ;
- cohérence web/mobile.

## 51. Intégration avec IA Core

L'IA Core peut aider à :

- générer pages cadrées ;
- relire sécurité web ;
- générer tests ;
- documenter composants ;
- vérifier cohérence UI ;
- identifier risques dépendances ;
- préparer ADR.

L'IA ne doit pas :

- manipuler de secrets ;
- ajouter une dépendance sans justification ;
- générer une application complète non cadrée ;
- décider seule d'un choix auth, state, observabilité ou E2E critique.

## 52. Intégration avec Quality Core

Quality Core doit relayer :

- standards de tests ;
- lint ;
- typecheck ;
- revue sécurité ;
- revue accessibilité ;
- revue performance ;
- critères de release web ;
- contrôle dépendances.

## 53. Intégration avec Docs Core

Docs Core doit soutenir le Web Core pour :

- guides installation ;
- guides auth/session ;
- guides upload ;
- guides SEO ;
- guides build/deploy ;
- ADR des choix structurants ;
- checklists release web.

## 54. Documentation obligatoire du core

À terme, le core devra contenir :

- `README.md` ;
- `CORE_SPECIFICATION.md` ;
- `ARCHITECTURE.md` ;
- `INSTALLATION.md` ;
- `USAGE.md` ;
- `TESTING.md` ;
- `SECURITY.md` ;
- `DEPENDENCIES.md` ;
- `ROADMAP.md` ;
- `CHANGELOG.md` ;
- guides auth ;
- guides UI ;
- guides SEO ;
- guides upload ;
- guides build/déploiement.

## 55. Roadmap du core

### V0 : spécification et cadrage

- Créer `CORE_SPECIFICATION.md`.
- Identifier les ADR nécessaires.
- Valider le périmètre V1.

### V1 : starter web minimal

- Créer structure Next.js cible.
- Ajouter App Router.
- Ajouter layouts standards.
- Ajouter auth flow.
- Ajouter routing protégé.
- Ajouter API client.
- Ajouter formulaires et validation.
- Ajouter UI components minimal.
- Ajouter SEO baseline.

### V2 : UI Kit, auth, formulaires, API, tests

- Stabiliser UI Kit web minimal.
- Stabiliser auth/session.
- Stabiliser API client.
- Ajouter tests critiques.
- Ajouter upload web.
- Ajouter lint, format, typecheck.
- Documenter usage.

### V3 : dashboards avancés, charts, upload, realtime, i18n

- Ajouter dashboard avancé.
- Ajouter data tables avancées.
- Ajouter charts si validés.
- Ajouter realtime si besoin.
- Ajouter i18n si besoin.
- Ajouter observabilité si ADR validé.

### VF : Web Core Next.js complet production-ready

- Stabiliser sécurité.
- Stabiliser performance.
- Stabiliser accessibilité.
- Stabiliser SEO.
- Stabiliser documentation.
- Maintenir compatibilité avec API, Cloud et UI Kit.

## 56. Critères d'acceptation V1

La V1 sera acceptable si :

- le starter web démarre avec Next.js ;
- App Router est opérationnel ;
- les layouts standards existent ;
- l'auth flow est fonctionnel ;
- les routes protégées sont fonctionnelles ;
- la session est sécurisée selon stratégie retenue ;
- la stratégie CSRF est documentée si cookies utilisés ;
- l'API client gère les erreurs ;
- les formulaires et validations fonctionnent ;
- les états loading/error/empty sont standardisés ;
- le SEO baseline est présent pour pages publiques ;
- les dashboards/backoffices sont non indexables ;
- aucun secret n'est exposé au client ou au bundle ;
- la documentation minimale existe.

## 57. Critères d'acceptation version finale

La version finale sera acceptable si :

- le core est production-ready ;
- auth, API client, UI, formulaires, upload et tests sont stables ;
- dashboards avancés et modules optionnels sont documentés si activés ;
- les dépendances critiques sont justifiées ;
- les ADR structurants sont présents ;
- les performances et Core Web Vitals sont maîtrisés ;
- l'accessibilité est couverte ;
- la sécurité web est validée ;
- build et déploiement sont documentés ;
- l'intégration Mobile Core React Native est claire ;
- les projets dérivés peuvent l'utiliser sans logique métier imposée.

## 58. Risques

- Stocker des tokens sensibles dans `localStorage`.
- Exposer des secrets via `NEXT_PUBLIC_*`.
- Mélanger données serveur et état local.
- Rendre les dashboards indexables.
- Ajouter trop de dépendances UI.
- Choisir une stratégie auth sans ADR.
- Sous-estimer CSRF si cookies utilisés.
- Exposer une variable serveur dans le bundle client.
- Négliger accessibilité, SEO ou Core Web Vitals.
- Créer des composants UI avec logique métier projet.
- Ajouter charts/maps/observabilité sans justification.

## 59. Anti-patterns interdits

- Secret exposé au client.
- Token sensible dans `localStorage`.
- Dashboard ou backoffice indexable par défaut.
- Cookies sensibles sans Secure en production.
- Cookies avec auth sans réflexion CSRF.
- Secret serveur exposé via `NEXT_PUBLIC_*`.
- Appels API dispersés dans composants UI.
- État serveur stocké durablement dans Zustand.
- Composants UI contenant logique métier projet.
- Dépendance ajoutée par confort sans justification.
- Génération IA d'une app complète sans périmètre.

## 60. Checklist de validation

- [ ] Le périmètre du core est clair.
- [ ] Le hors périmètre est explicite.
- [ ] Les modules obligatoires sont listés.
- [ ] Les modules optionnels sont séparés.
- [ ] App Router est cadré.
- [ ] Auth, session et cookies sont cadrés.
- [ ] CSRF est traité si cookies utilisés.
- [ ] Routes protégées et permissions sont cadrées.
- [ ] API client et erreurs sont cadrés.
- [ ] Server state et état local sont séparés.
- [ ] Formulaires et validation sont couverts.
- [ ] UI Kit web est cadré.
- [ ] SEO public et non-indexation dashboard sont couverts.
- [ ] Aucun secret serveur n'est exposé dans le bundle client.
- [ ] L'intégration Mobile Core React Native est décrite.
- [ ] Tests attendus sont définis.
- [ ] Sécurité web est couverte.
- [ ] Décisions à ADR sont identifiées.
- [ ] Aucun code applicatif n'est généré.

## 61. Conclusion

Le Web Core Next.js doit devenir le socle web standard d'Enistere OS Foundation pour construire rapidement des interfaces publiques, SaaS, dashboards et backoffices sécurisés, cohérents et maintenables.

Cette spécification définit le périmètre final attendu sans créer de projet Next.js ni de code. Les choix structurants, notamment stratégie server state, client HTTP, auth/session, observabilité, E2E, charts, maps web et génération client OpenAPI, devront être validés avant implémentation et documentés par ADR si leur impact est structurant.
