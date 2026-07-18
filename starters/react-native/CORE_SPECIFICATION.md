# Mobile Core React Native — Spécification du Core

## 1. Résumé exécutif

Le **Mobile Core React Native** définit le socle mobile React Native / Expo de référence pour les futures applications Enistere.

Il doit fournir une base modulaire, sécurisée, maintenable et réutilisable pour construire des applications mobiles : marketplace, livraison, immobilier, SaaS, outils métier, administration mobile, tracking, e-commerce, social ou autres usages.

Cette spécification est documentaire. Elle ne crée pas de projet React Native, projet Expo, `package.json`, dossier `src/`, composant réel, fichier de navigation ou code applicatif.

## 2. Rôle du core

Le rôle du Mobile Core React Native est de cadrer la base commune des applications mobiles Enistere.

Il doit :

- standardiser la structure des applications Expo / React Native ;
- définir les modules mobiles communs ;
- sécuriser l'authentification et la gestion des tokens ;
- standardiser les appels API, uploads, formulaires, validation et erreurs ;
- préparer l'intégration UI Kit, API Core, Cloud Core, IA Core, Quality Core et Docs Core ;
- fournir un périmètre extensible pour maps, tracking, offline, notifications et modules avancés.

## 3. Objectifs du Mobile Core React Native

- Fournir un starter mobile minimal puis production-ready à terme.
- Utiliser Expo et Expo Router comme base cible.
- Standardiser TypeScript, navigation, auth flow, protected routes et configuration.
- Gérer les tokens de manière sécurisée.
- Fournir un API client et une stratégie upload compatible API Core NestJS.
- Standardiser TanStack Query pour l'état serveur et Zustand pour l'état local simple.
- Standardiser React Hook Form et Zod pour les formulaires et la validation.
- Prévoir un thème mobile et des composants UI minimaux.
- Préparer notifications push, maps, géolocalisation, tracking et offline.
- Rester générique, sans logique métier spécifique à Kivvoo, Bailo, RFashion, Vox Pulse, CIVIS ID ou tout autre projet dérivé.

## 4. Problèmes à résoudre

Le core doit éviter :

- une nouvelle structure mobile à chaque projet ;
- des auth flows divergents ;
- des tokens stockés de manière non sécurisée ;
- des appels API dispersés ;
- des uploads multipart instables ;
- des formulaires et validations incohérents ;
- des états loading, empty, error ou success non standardisés ;
- des composants UI dupliqués ;
- des permissions natives non justifiées ;
- une dépendance directe à un provider maps coûteux sans validation ;
- une absence de tests sur auth, API, upload et navigation.

## 5. Périmètre fonctionnel

Le Mobile Core React Native couvre :

- structure Expo ;
- Expo Router ;
- auth flow ;
- protected routes ;
- API client ;
- upload client avec `fetch + FormData` ;
- token management ;
- secure storage ;
- query client ;
- state management local ;
- theme system ;
- UI components minimal ;
- form handling ;
- validation ;
- error handling ;
- loading, empty, error et success states ;
- notification setup minimal ;
- environment config ;
- app constants ;
- logger minimal ;
- testing setup futur ;
- modules optionnels maps, tracking, realtime, offline et media.

## 6. Hors périmètre

Le core ne doit pas contenir :

- logique métier projet ;
- écrans complets spécifiques à un produit ;
- design final propre à une marque projet ;
- projet Expo réel dans cette mission ;
- composant réel dans cette mission ;
- navigation réelle dans cette mission ;
- dépendance installée ;
- secret ou clé API ;
- choix définitif `react-native-maps` vs MapLibre sans ADR ;
- choix définitif de librairie carousel sans ADR si le choix devient structurant ;
- choix définitif Sentry vs alternative sans ADR si le choix devient structurant.

## 7. Architecture cible

L'architecture cible doit séparer :

- app routes ;
- modules fonctionnels ;
- services API ;
- état serveur ;
- état local ;
- composants UI ;
- features métier isolées ;
- thème ;
- hooks ;
- validation ;
- stockage ;
- permissions natives ;
- configuration.

Principes :

- TypeScript strict recommandé ;
- server state dans TanStack Query ;
- état local simple dans Zustand ;
- tokens sensibles dans stockage sécurisé ;
- aucun secret dans l'application mobile ;
- composants UI génériques ;
- architecture feature-first possible avec séparation `core/`, `shared/` et `features/` ;
- modules avancés activables selon projet ;
- intégration API via contrats documentés.

## 8. Structure cible du futur starter

Structure indicative du futur starter :

```txt
starters/react-native/
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
    ├── src/
    │   ├── core/
    │   │   ├── api/
    │   │   ├── auth/
    │   │   ├── config/
    │   │   ├── constants/
    │   │   ├── errors/
    │   │   ├── forms/
    │   │   ├── logger/
    │   │   ├── notifications/
    │   │   ├── permissions/
    │   │   ├── query/
    │   │   ├── storage/
    │   │   ├── theme/
    │   │   └── upload/
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

- App structure Expo ;
- Expo Router ;
- Auth flow ;
- Protected routes ;
- API client ;
- Upload client avec `fetch + FormData` ;
- Token management ;
- Secure storage ;
- Query client ;
- State management local ;
- Theme system ;
- UI components minimal ;
- Form handling ;
- Validation ;
- Error handling ;
- Loading states ;
- Empty states ;
- Notification setup minimal ;
- Environment config ;
- App constants ;
- Logger minimal ;
- Testing setup futur.

## 10. Modules optionnels

Ces modules doivent être activables selon projet :

- Maps module ;
- Geolocation module ;
- Tracking module ;
- Realtime module ;
- Push notifications avancées ;
- Camera module ;
- Media picker ;
- Document picker ;
- Carousel module ;
- Bottom sheet module ;
- Offline sync module ;
- Analytics module ;
- Crash reporting module ;
- Deep linking avancé ;
- Payment mobile integration ;
- Chat module ;
- QR code scanner.

## 11. Modules futurs

Les modules futurs peuvent inclure :

- feature flags ;
- internationalisation avancée ;
- multi-tenant mobile ;
- biometric authentication ;
- encrypted local database ;
- background sync avancée ;
- app update strategy ;
- design token sync ;
- accessibility audit tooling ;
- generated API client depuis OpenAPI.

Ces modules nécessiteront validation de roadmap et ADR si leur impact est structurant.

## 12. Standards React Native

Le core doit respecter :

- composants fonctionnels ;
- hooks explicites ;
- séparation UI, logique et services ;
- pas de logique métier dans les composants UI ;
- services API isolés ;
- styles cohérents avec le thème ;
- dimensions responsives ;
- gestion des états utilisateur ;
- conventions de nommage claires ;
- tests sur composants critiques.

## 13. Standards Expo

Expo est la base cible.

Le core doit prévoir :

- Expo Router ;
- configuration par environnement ;
- permissions natives déclarées et justifiées ;
- builds compatibles EAS si retenu plus tard ;
- notifications Expo si activées ;
- image picker et document picker optionnels ;
- location optionnelle ;
- pas de secret dans la configuration mobile ;
- valeurs `EXPO_PUBLIC_*` réservées aux données publiques.

## 14. Standards TypeScript

Le core doit prévoir :

- TypeScript strict recommandé ;
- types explicites pour services publics ;
- modèles de payload API typés ;
- erreurs typées si possible ;
- schémas de validation ;
- éviter `any` sauf justification ;
- séparation des types API, UI et domaine ;
- documentation des conventions.

## 15. Standards sécurité mobile

Le core doit appliquer :

- aucun secret dans l'application mobile ;
- variables `EXPO_PUBLIC_*` uniquement pour valeurs publiques ;
- access token en mémoire si possible ;
- refresh token dans stockage sécurisé ;
- logout supprimant les tokens ;
- gestion expiration token ;
- logs sans tokens ni données sensibles ;
- permissions natives justifiées ;
- HTTPS obligatoire en production ;
- protection contre fuite d'erreurs sensibles ;
- validation côté client sans remplacer la validation backend.

## 16. Navigation

La navigation cible repose sur Expo Router.

Elle doit prévoir :

- routes publiques ;
- routes protégées ;
- layout auth ;
- layout application ;
- redirection selon état auth ;
- gestion session expirée ;
- deep linking si nécessaire ;
- conventions de nommage des routes.

La navigation réelle ne doit pas être créée dans cette mission.

## 17. Authentification mobile

L'auth mobile doit prévoir :

- login ;
- register si activé selon projet ;
- logout ;
- refresh token ;
- restauration de session ;
- état auth global ;
- récupération du profil courant ;
- gestion erreur auth ;
- gestion de session expirée ;
- invalidation côté serveur si supportée par API Core ;
- comportement offline documenté pour les sessions restaurées ;
- protection des routes ;
- compatibilité API Core NestJS.

Le core ne doit pas imposer de workflow métier d'inscription propre à un produit.

## 18. Gestion des tokens

La stratégie token doit prévoir :

- access token court ;
- access token en mémoire si possible ;
- refresh token en stockage sécurisé ;
- refresh automatique contrôlé ;
- révocation possible côté API ;
- suppression complète au logout ;
- gestion de l'expiration ;
- absence de token dans logs ;
- absence de token dans Zustand ou MMKV non chiffré si sensible.

## 19. Stockage sécurisé

Le core doit prévoir :

- Expo SecureStore ou React Native Keychain pour données sensibles ;
- MMKV uniquement pour données rapides non sensibles ou chiffrées si validé ;
- séparation stockage sensible/non sensible ;
- nettoyage au logout ;
- stratégie migration de stockage si nécessaire ;
- tests token storage.

Le choix SecureStore vs Keychain doit être documenté selon contraintes Expo/build.

## 20. Intégration API

Le core doit fournir un API client standardisé.

Il doit couvrir :

- base URL par environnement ;
- headers publics ;
- injection access token ;
- gestion refresh token ;
- erreurs standardisées ;
- timeout ou abort si applicable ;
- retry contrôlé ;
- wrappers ou intercepteurs applicatifs ;
- typage des réponses ;
- intégration TanStack Query ;
- compatibilité OpenAPI si génération validée ;
- absence de secrets dans le client.

Axios peut être retenu pour JSON si justifié, mais ne doit pas être imposé pour les uploads multipart.

## 21. Stratégie upload fichiers

La stratégie upload doit utiliser `fetch + FormData` pour les uploads `multipart/form-data`.

Règles :

- éviter Axios pour les uploads multipart en React Native sauf justification ;
- ne pas forcer manuellement le header `Content-Type: multipart/form-data` si cela casse le boundary ;
- supporter images, documents et fichiers selon projet ;
- gérer taille maximale ;
- gérer progression si possible selon l'approche retenue ;
- gérer erreurs réseau ;
- documenter les limites connues ;
- s'intégrer avec API Core UploadModule ;
- ne jamais contourner les validations backend.

## 22. Gestion du cache API

TanStack Query doit gérer l'état serveur.

Le core doit définir :

- query client ;
- clés de requêtes ;
- invalidation ;
- retry ;
- stale time ;
- cache time ;
- mutations ;
- gestion offline si activée ;
- stratégie erreurs ;
- séparation avec Zustand.

## 23. Gestion état local

Zustand doit être utilisé pour l'état local simple.

Usages :

- état UI ;
- préférences non sensibles ;
- filtres temporaires ;
- état de navigation ou modales ;
- données non serveur.

Les données serveur doivent rester dans TanStack Query.

## 24. Formulaires et validation

Le core doit prévoir :

- React Hook Form ;
- Zod ;
- schémas de validation ;
- erreurs de champs standardisées ;
- messages lisibles ;
- validation côté client ;
- validation backend obligatoire ;
- composants form compatibles UI Kit.

## 25. Gestion des erreurs

Le core doit standardiser :

- erreurs API ;
- erreurs réseau ;
- erreurs auth ;
- erreurs upload ;
- erreurs validation ;
- erreurs permissions ;
- erreurs maps/tracking si activés ;
- erreurs inconnues.

Les erreurs affichées à l'utilisateur doivent être utiles sans exposer d'information sensible.

## 26. Gestion loading / empty / error / success

Le core doit prévoir des patterns pour :

- loading initial ;
- loading mutation ;
- empty state ;
- error state ;
- success state ;
- retry ;
- skeleton ou placeholder si validé ;
- feedback utilisateur cohérent.

Ces états doivent être compatibles UI Kit.

## 27. UI Kit mobile

Le Mobile Core doit consommer ou préparer le futur UI Kit mobile.

Il doit prévoir :

- thème ;
- couleurs ;
- typographies ;
- spacing ;
- radius ;
- composants de base ;
- accessibilité ;
- états loading/disabled/error ;
- compatibilité dark mode si validée.

Le core ne doit pas créer une identité visuelle spécifique projet.

## 28. Composants de base

Les composants minimaux futurs peuvent inclure :

- Button ;
- Text ;
- Input ;
- Select ;
- Checkbox ;
- Switch ;
- Card ;
- ListItem ;
- Avatar ;
- Badge ;
- Alert ;
- Toast ;
- Loader ;
- EmptyState ;
- ErrorState.

Ces composants doivent rester génériques.

## 29. Headers et navigation UI

Le core doit prévoir :

- header standard ;
- back button ;
- title ;
- actions ;
- tabs si nécessaire ;
- bottom navigation si nécessaire ;
- safe areas ;
- adaptation iOS/Android.

Les headers doivent respecter le futur UI Kit.

## 30. Slides et carousels

Les carousels sont optionnels.

Le core doit prévoir :

- interface d'abstraction ;
- accessibilité ;
- performance ;
- gestion images ;
- pagination ;
- fallback simple si non activé.

Le choix de librairie carousel doit être validé par ADR si le composant devient structurant.

## 31. Bottom sheets et modals

Le core doit prévoir :

- modals simples ;
- bottom sheets optionnels ;
- fermeture contrôlée ;
- accessibilité ;
- gestion clavier ;
- gestures ;
- cohérence UI Kit.

Gorhom Bottom Sheet peut être envisagé, sans installation à ce stade.

## 32. Notifications push

Le setup minimal doit prévoir :

- permissions notifications ;
- token push si activé ;
- gestion premier lancement ;
- handlers foreground/background ;
- distinction notifications locales et push ;
- cas d'usage génériques ;
- deep link depuis notification si nécessaire ;
- intégration API pour enregistrement token ;
- logs sans données sensibles.

Les notifications avancées restent optionnelles.

## 33. Géolocalisation

La géolocalisation doit être optionnelle et justifiée.

Le core doit prévoir :

- demande permission explicite ;
- usage limité au besoin ;
- arrêt tracking quand non nécessaire ;
- précision adaptée ;
- consommation batterie maîtrisée ;
- messages utilisateur clairs ;
- conformité sécurité et confidentialité.

## 34. Maps, marqueurs et polygones

Le module maps doit prévoir :

- carte ;
- marqueurs ;
- polygones ;
- zones ;
- clustering si nécessaire ;
- thème ou style map ;
- fallback si provider indisponible ;
- intégration UI Kit.

Le choix `react-native-maps` vs MapLibre doit être tranché par ADR.

## 35. Itinéraires et routing

Le routing mobile doit consommer un Routing Service côté API.

Il doit prévoir :

- demande d'itinéraire via API ;
- intégration possible avec OSRM via Cloud Core ;
- fallback potentiel Mapbox ou Google Directions selon projet ;
- affichage polyline ;
- gestion erreurs routing ;
- cache éventuel ;
- absence d'appel direct à OSRM interne depuis mobile.

## 36. Tracking et suivi temps réel

Le tracking doit être optionnel et strictement cadré.

Il doit prévoir :

- permission explicite ;
- suivi uniquement quand nécessaire ;
- arrêt tracking après usage ;
- fréquence adaptée ;
- gestion batterie ;
- précision GPS adaptée au besoin ;
- confidentialité des données de localisation ;
- realtime si activé ;
- audit côté API si nécessaire ;
- information utilisateur claire.

## 37. Offline et synchronisation

Le offline doit être activable selon projet.

Il peut couvrir :

- cache lecture ;
- queue de mutations ;
- retry réseau ;
- indication offline ;
- conflits de synchronisation ;
- invalidation après reconnexion ;
- stockage local non sensible.

Les données sensibles offline nécessitent validation sécurité.

## 38. Permissions natives

Chaque permission native doit être :

- justifiée ;
- documentée ;
- demandée au bon moment ;
- limitée au besoin ;
- accompagnée d'un message clair ;
- testée sur iOS et Android si applicable.

Exemples : notifications, camera, photos, documents, location, bluetooth si besoin futur.

## 39. Configuration environnement

Le core doit prévoir :

- environnements local, staging, production ;
- base URL API ;
- flags publics ;
- constantes d'application ;
- configuration Expo ;
- valeurs `EXPO_PUBLIC_*` uniquement publiques ;
- absence de secrets ;
- documentation des variables.

## 40. Build et distribution

Le core doit cadrer :

- builds locaux ;
- builds EAS potentiels ;
- builds dev, staging et production ;
- profils staging/production ;
- versioning application ;
- signature et credentials de build hors Git ;
- variables par environnement ;
- absence de secrets dans les builds ;
- distribution interne ;
- stores iOS/Android plus tard ;
- release notes ;
- rollback applicatif si possible.

Aucun build réel n'est créé dans cette mission.

## 41. Tests attendus

Le core doit prévoir :

- tests services API ;
- tests hooks ;
- tests auth flow ;
- tests token storage ;
- tests upload client ;
- tests validation formulaire ;
- tests composants UI critiques ;
- tests états loading/error/empty ;
- tests navigation si applicable ;
- tests maps/tracking si module activé.

## 42. Qualité et lint

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

## 43. Observabilité mobile

Le core doit prévoir :

- logger minimal ;
- logs sans secrets ;
- capture erreurs critique ;
- crash reporting optionnel ;
- breadcrumbs non sensibles ;
- environnement attaché aux erreurs ;
- désactivation ou réduction des logs en production.

Sentry ou une alternative pourra être retenu par ADR si le crash reporting devient structurant.

## 44. Performance

Le core doit cadrer :

- images optimisées ;
- listes performantes ;
- pagination ;
- memoization si nécessaire ;
- éviter re-render inutiles ;
- animations maîtrisées ;
- temps de démarrage surveillé ;
- bundles surveillés ;
- lazy loading si pertinent ;
- cache API maîtrisé ;
- maps/tracking optimisés ;
- consommation batterie surveillée.

## 45. Accessibilité

Le core doit prévoir :

- labels accessibles ;
- tailles tactiles suffisantes ;
- contraste ;
- navigation clavier si applicable ;
- support lecteur d'écran ;
- états focus ;
- textes lisibles ;
- erreurs de formulaire accessibles ;
- composants UI accessibles.

## 46. Sécurité des dépendances

Toute dépendance doit être justifiée.

Règles :

- éviter dépendances gadgets ;
- éviter doublons ;
- analyser maintenance, compatibilité Expo, licence et sécurité ;
- ADR pour maps, carousel, crash reporting ou stockage structurant si nécessaire ;
- ne pas ajouter de dépendance sans validation ;
- documenter les alternatives.

## 47. Intégration avec API Core NestJS

Le Mobile Core React Native doit s'intégrer avec API Core NestJS pour :

- auth JWT ;
- refresh token ;
- profil utilisateur ;
- rôles et permissions si nécessaires côté UI ;
- upload fichiers ;
- erreurs standardisées ;
- pagination ;
- OpenAPI si génération client validée ;
- notifications ;
- Routing Service si maps/tracking activés.

## 48. Intégration avec Cloud Core

Le Mobile Core consomme les services exposés par Cloud Core via API ou endpoints publics sécurisés.

Il doit respecter :

- HTTPS en production ;
- endpoints stables ;
- OSRM consommé via API Routing Service, jamais directement ;
- MinIO consommé via API ou URLs signées contrôlées ;
- certificats valides ;
- disponibilité et health checks côté backend.

## 49. Intégration avec UI Kit

Le core doit être compatible avec UI Kit :

- design tokens ;
- composants mobiles ;
- thème ;
- états standardisés ;
- accessibilité ;
- dark mode si validé ;
- cohérence web/mobile si applicable.

## 50. Intégration avec IA Core

L'IA Core peut aider à :

- générer services API ;
- relire sécurité mobile ;
- générer tests ;
- documenter composants ;
- vérifier cohérence UI ;
- identifier risques dépendances.

L'IA ne doit pas :

- manipuler de secrets ;
- ajouter une dépendance sans justification ;
- générer une application complète non cadrée ;
- décider seule d'un choix maps, crash reporting ou architecture mobile critique.

## 51. Intégration avec Quality Core

Quality Core doit relayer :

- standards de tests ;
- lint ;
- typecheck ;
- revue sécurité ;
- revue accessibilité ;
- revue performance ;
- critères de release mobile ;
- contrôle dépendances.

## 52. Documentation obligatoire du core

Le Mobile Core React Native doit s'intégrer avec Docs Core pour maintenir :

- guides d'installation ;
- guides auth et tokens ;
- guides upload ;
- guides permissions natives ;
- guides build/distribution ;
- ADR des choix structurants ;
- checklists de release mobile.

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
- guides upload ;
- guides maps/tracking si activés ;
- guides build/distribution.

## 53. Roadmap du core

### V0 : spécification et cadrage

- Créer `CORE_SPECIFICATION.md`.
- Identifier les ADR nécessaires.
- Valider le périmètre V1.

### V1 : starter mobile minimal

- Créer structure Expo cible.
- Ajouter Expo Router.
- Ajouter auth flow.
- Ajouter protected routes.
- Ajouter API client.
- Ajouter token management.
- Ajouter secure storage.
- Ajouter TanStack Query.
- Ajouter Zustand.
- Ajouter thème minimal.
- Ajouter formulaires et validation.

### V2 : qualité, tests, composants UI, upload, notifications

- Ajouter tests critiques.
- Stabiliser UI components minimal.
- Ajouter upload client `fetch + FormData`.
- Ajouter notification setup minimal.
- Ajouter lint, format, typecheck.
- Documenter usage.

### V3 : maps, tracking, offline, modules avancés

- Ajouter maps selon ADR.
- Ajouter geolocation.
- Ajouter tracking si besoin.
- Ajouter offline sync si besoin.
- Ajouter bottom sheets, carousel ou media modules selon validation.
- Ajouter crash reporting si ADR validé.

### VF : Mobile Core React Native complet production-ready

- Stabiliser sécurité.
- Stabiliser performance.
- Stabiliser accessibilité.
- Stabiliser documentation.
- Stabiliser tests.
- Maintenir compatibilité avec API, Cloud et UI Kit.

## 54. Critères d'acceptation V1

La V1 sera acceptable si :

- le starter mobile démarre avec Expo ;
- Expo Router est opérationnel ;
- l'auth flow est fonctionnel ;
- les routes protégées sont fonctionnelles ;
- le token management est sécurisé ;
- le refresh token est stocké dans un stockage sécurisé ;
- l'API client gère les erreurs ;
- TanStack Query est configuré ;
- Zustand est limité à l'état local ;
- les formulaires et validations fonctionnent ;
- les états loading/error/empty sont standardisés ;
- aucun secret n'est présent dans l'application ;
- la documentation minimale existe.

## 55. Critères d'acceptation version finale

La version finale sera acceptable si :

- le core est production-ready ;
- auth, API client, upload, cache, UI et tests sont stables ;
- maps/tracking/offline sont documentés si activés ;
- les dépendances critiques sont justifiées ;
- les ADR structurants sont présents ;
- les performances sont maîtrisées ;
- l'accessibilité est couverte ;
- la sécurité mobile est validée ;
- les builds et distributions sont documentés ;
- les projets dérivés peuvent l'utiliser sans logique métier imposée.

## 56. Risques

- Stocker des tokens dans un stockage non sécurisé.
- Exposer des secrets via `EXPO_PUBLIC_*`.
- Utiliser Axios pour upload multipart sans tester les boundaries.
- Mélanger état serveur et état local.
- Ajouter trop de dépendances UI.
- Choisir maps provider sans ADR.
- Consommer directement OSRM depuis mobile.
- Activer tracking sans justification claire.
- Sous-estimer la batterie et la performance.
- Négliger accessibilité et tests.

## 57. Anti-patterns interdits

- Secret dans l'application mobile.
- Refresh token dans MMKV non chiffré ou AsyncStorage.
- Logs contenant tokens ou données sensibles.
- Upload multipart avec header `Content-Type` cassant le boundary.
- Appel direct mobile vers OSRM interne.
- Provider maps coûteux imposé sans ADR.
- Composants UI contenant logique métier projet.
- État serveur stocké durablement dans Zustand.
- Permission native demandée sans justification.
- Génération IA d'une app complète sans périmètre.

## 58. Checklist de validation

- [ ] Le périmètre du core est clair.
- [ ] Le hors périmètre est explicite.
- [ ] Les modules obligatoires sont listés.
- [ ] Les modules optionnels sont séparés.
- [ ] Expo et Expo Router sont cadrés.
- [ ] Auth flow et protected routes sont cadrés.
- [ ] Token management et secure storage sont couverts.
- [ ] Upload via `fetch + FormData` est cadré.
- [ ] TanStack Query et Zustand sont séparés.
- [ ] Formulaires et validation sont couverts.
- [ ] UI Kit mobile est cadré.
- [ ] Maps/tracking/OSRM sont cadrés sans choix définitif non validé.
- [ ] Tests attendus sont définis.
- [ ] Sécurité mobile est couverte.
- [ ] Décisions à ADR sont identifiées.
- [ ] Aucun code applicatif n'est généré.

## 59. Conclusion

Le Mobile Core React Native doit devenir le socle mobile standard d'Enistere OS Foundation pour construire rapidement des applications mobiles sécurisées, cohérentes et maintenables.

Cette spécification définit le périmètre final attendu sans créer de projet Expo ni de code. Les choix structurants, notamment maps, carousel, crash reporting, stockage sensible avancé, génération client OpenAPI et stratégie offline, devront être validés avant implémentation et documentés par ADR si leur impact est structurant.
