# ADR-016 — OpenAPI et génération de clients typés

## 1. Titre

Stratégie de contrat OpenAPI canonique et de génération de clients typés pour les cores Enistere OS Foundation.

## 2. Statut

Validé.

## 3. Date

2026-06-09.

## 4. Contexte

Le API Core NestJS V1 est l'**autorité des contrats HTTP publics** (ADR-004). Il expose 13 routes
(Health ×3, Auth ×5, Files ×5), produit un document **OpenAPI 3.0 valide** (`@nestjs/swagger`,
commande `npm run openapi:generate`, artefact temporaire gitignoré) et journalise de façon
structurée (ADR-040). Les clients officiels sont **Fetch** (ADR-011, Axios par exception) et
**TanStack Query** pour le server state (ADR-012). La validation API repose sur class-validator
(ADR-003) ; les modèles Prisma ne sont jamais exposés (DTO publics séparés).

Les revues (`docs/API_CORE_V1_REVIEW.md`, `…_NEXT_ROADMAP.md`, `FILES_REVIEW.md`) identifient le
chantier **« stabilisation OpenAPI + ADR-016 »** comme prochain jalon transverse. L'analyse du
contrat courant montre des limites bloquant la génération de clients fiables :

- **réponses publiques peu typées** : les contrats internes sont des interfaces TypeScript
  (`PublicStoredFile`, `SignedDownloadResult`, principal Auth…) non visibles par la réflexion
  Swagger → la plupart des réponses apparaissent **non typées** dans OpenAPI ;
- **enveloppe globale générique** non décrite : succès `{ success, data, timestamp }` (interceptor)
  et erreur `{ success, statusCode, message, errorCode, details, path, timestamp }` (filtre) ne sont
  pas modélisés dans le schéma ;
- **`operationId` instables** : ils sont auto-générés par NestJS au format `Controller_method`
  (`AuthController_login`, `FilesController_upload`…), liés au nom de classe/méthode interne ;
- **erreurs communes** non formalisées en schéma ;
- **multipart** à vérifier pour la compatibilité `fetch + FormData` (Web et React Native) ;
- **aucun client typé** n'est encore généré.

Le backlog (`docs/adr/ADR_BACKLOG.md`) réserve déjà l'identifiant **ADR-016** à « OpenAPI et
génération de clients typés ». Cette ADR tranche la stratégie ; elle est **documentaire** (aucun
code, aucun package).

## 5. Problème

Sans stratégie commune, le contrat OpenAPI ne peut pas devenir le point d'intégration stable entre
le API Core, le Web Core Next.js, le Mobile Core React Native, le futur Web Core Angular, le futur
Mobile Core Flutter et les projets dérivés. Risques : interfaces écrites à la main, divergence
backend/clients, erreurs détectées au runtime, hooks TanStack Query incohérents, upload multipart
cassé, `operationId` instables, breaking changes silencieux, exposition de champs internes,
lock-in à un générateur, génération différente par projet.

## 6. Objectifs

Produire un contrat OpenAPI **stable**, le **versionner**, **détecter ses breaking changes**,
**générer types et client** consommés par les autres cores, intégrer le **transport Fetch** et
**TanStack Query** sans les mélanger, prendre en charge **Next.js** et **React Native**, **préparer**
Angular et Flutter (sans les implémenter), gérer **multipart/FormData**, et **éviter la divergence**
API ↔ clients.

## 7. Non-objectifs

Aucune génération de client effective dans cette mission ; aucun code applicatif ; aucun package
installé ; aucun workflow CI créé ; aucun générateur Dart figé ; aucune implémentation des DTO de
sortie (cadrés ici, implémentés dans la mission dédiée). Cette ADR ne modifie ni le starter API ni
les cores clients.

## 8. Principes

1. **API source de vérité** : le document OpenAPI produit par le API Core fait foi ; les clients ne
   redéfinissent pas manuellement un contrat déjà présent dans OpenAPI.
2. **Prisma reste interne** : jamais de modèle Prisma, `passwordHash`, `tokenHash`, `storageKey`,
   `bucket`, `checksum`, secret ou metadata technique privée dans le document.
3. **Génération reproductible** : à version identique de contrat + d'outils figés → mêmes artefacts.
4. **Code généré non modifié** : on **régénère**, jamais on ne corrige le généré ; les
   personnalisations vivent dans des wrappers / mutators / adapters / services.
5. **Transport ≠ server state** : le client HTTP (sérialisation, appel Fetch, paramètres, réponses,
   erreurs de transport) est distinct de TanStack Query (cache, query keys, invalidation, mutations,
   retries, états serveur).

## 9. Décisions séparées

L'ADR distingue : **A** production du contrat ; **B** validation/contrôle/breaking changes ; **C**
génération des **types** ; **D** **client HTTP** Fetch ; **E** intégration **TanStack Query** ;
**F** **Angular** ; **G** **Flutter** (futur). Chacune est tranchée ci-dessous (§13+).

## 10. État OpenAPI actuel

`openapi: 3.0.0` ; **13 paths** ; **3 schemas** ; sécurité **Bearer** présente ; **aucun secret ni
modèle Prisma** (vérifié) ; Swagger désactivé en production. Limites : réponses non typées
(interfaces TS non réflexives), enveloppe générique non décrite, `operationId` au format
`Controller_method`, erreurs non schématisées, artefact `openapi.json` **gitignoré** (temporaire).

## 11. Options étudiées

- **A — OpenAPI Generator** (`typescript-fetch`, `typescript-angular`, `dart`).
- **B — Orval** (fetch, react-query, angular, zod, MSW, mutators).
- **C — `openapi-typescript` + `openapi-fetch`** (types statiques + client Fetch léger + wrappers +
  hooks TanStack Query écrits séparément).
- **D — Générateur Enistere maison.**
- **E — Types uniquement + appels Fetch manuels.**

## 12. Comparaison

| Critère | A — OpenAPI Generator | B — Orval | C — openapi-typescript + openapi-fetch | D — maison | E — types + manuel |
|---|---|---|---|---|---|
| OpenAPI 3.0 / 3.1 futur | ✅ / ⚠️ | ✅ / ⚠️ | ✅ / ✅ | selon impl. | ✅ / ✅ |
| NestJS / TS strict | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fetch natif (ADR-011) | ✅ (runtime imposé) | ✅ | ✅ (idiomatique) | ✅ | ✅ |
| React Native | ✅ | ✅ | ✅ | ✅ | ✅ |
| Next.js client+serveur | ✅ | ✅ | ✅ | ✅ | ✅ |
| Angular natif (HttpClient/DI) | ✅ (`typescript-angular`) | ✅ (angular) | ❌ (Fetch, pas HttpClient) | ⚠️ | ❌ |
| Flutter/Dart futur | ✅ (`dart`) | ❌ | ❌ (contrat réutilisable) | ⚠️ | ❌ |
| TanStack Query | ⚠️ non natif | ✅ (généré) | ✅ (écrit séparément, découplé) | ⚠️ | ✅ manuel |
| multipart / FormData / RN | ⚠️ runtime propre | ⚠️ selon options | ✅ (FormData natif, boundary auto) | ⚠️ | ✅ |
| Sans `Content-Type` multipart forcé | ⚠️ à vérifier | ⚠️ à vérifier | ✅ | dépend | ✅ |
| Enveloppe + erreurs typées | via schéma | via schéma | via schéma + wrapper | ✅ | partiel |
| BigInt→string / enum / date / binary | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reproductibilité | ✅ (versions figées) | ✅ | ✅ | ⚠️ | ✅ |
| Taille des artefacts | ⚠️ volumineux | moyen | **léger** | variable | minimal |
| Personnalisation | ⚠️ templates | ✅ mutators | ✅ wrappers | ✅ total | ✅ |
| Mocks/tests | partiel | ✅ MSW | via outillage | à écrire | à écrire |
| Lock-in | moyen | moyen (opinionné) | **faible** | élevé (maison) | faible |
| Coût de migration | élevé | moyen→C | faible | élevé | élevé (divergence) |
| Multi-repositories | ✅ | ✅ | ✅ | ⚠️ | ⚠️ |

**Lecture** : **D** (maison) et **E** (manuel) sont écartés (réinvention / duplication, risque de
divergence). **A** et **B** offrent des SDK complets mais imposent un runtime, couplent volontiers
transport et cache, et leur valeur diminue dès qu'on exige des wrappers Enistere. **C** est le plus
aligné avec Fetch (ADR-011), la séparation transport/cache (ADR-012), React Native, un faible
lock-in et un contrat réutilisable hors TypeScript (Flutter). Pour **Angular** (HttpClient/DI) et
**Dart**, **C** ne suffit pas seul → adaptateurs spécifiques décidés séparément (F/G).

## 13. Décision

1. **Production du contrat (A)** : **NestJS + `@nestjs/swagger`** produit un document OpenAPI
   **canonique versionné**, après stabilisation (DTO de sortie + décorateurs d'enveloppe +
   `operationId` stables + tags + formats).
2. **Validation (B)** : **lint + validation syntaxique** (Redocly CLI ou Spectral) **+ détection de
   breaking changes** (`oasdiff`/`openapi-diff`) **avant merge** de toute évolution de contrat.
3. **Types (C)** : **`openapi-typescript`** (types canoniques, runtime-indépendants).
4. **Client HTTP (D)** : **`openapi-fetch`** (transport Fetch léger) **+ wrappers Enistere**.
5. **TanStack Query (E)** : **hooks écrits dans les cores clients** (Web/Mobile), au-dessus du
   client généré — **non générés**.
6. **Angular (F)** : **contrat et types communs** ; **adaptateur Angular spécifique autorisé**
   (Orval Angular ou OpenAPI Generator `typescript-angular`), évalué **par preuve** dans le Web Core
   Angular.
7. **Flutter (G)** : **aucun générateur Dart figé** ; le document reste indépendant du TypeScript,
   avec `operationId` stables et schémas standards, pour un générateur Dart décidé **avec** le
   Flutter Core.
8. **Distribution** : **package npm privé versionné** (ou artefact de release), **jamais** de
   dépendance à l'URL Swagger de production ; **deux packages conceptuels** —
   `@enistere/api-contracts` (OpenAPI + types, runtime-indépendant) et `@enistere/api-client`
   (client Fetch + wrappers).

Ce mécanisme est **imposé** : un projet dérivé n'arbitre pas librement entre outils ; il applique
cette chaîne, avec les replis définis (§19).

## 14. Production du contrat

`SwaggerModule.createDocument` à partir des contrôleurs décorés. Un **`operationIdFactory`
explicite** (§18) remplace le défaut `Controller_method`. Le document est **régénéré** par
`openapi:generate` et **comparé** au snapshot canonique versionné (§29) ; tout écart non intentionnel
échoue en CI. Swagger UI reste désactivé en production.

## 15. DTO de sortie

Créer (mission d'implémentation) des **DTO publics explicites** (classes décorées `@ApiProperty`,
visibles par la réflexion Swagger) pour : Health (général/live/ready), login, refresh, logout,
profil utilisateur, résumé d'autorisations, fichier public, URL signée, et le schéma d'erreur commun.
**Interdits** comme type de réponse : `Promise<object>`, `Record<string, unknown>`, interfaces TS
non réflexives, modèles Prisma. Les DTO de sortie sont distincts des DTO d'entrée et des modèles de
persistance.

## 16. Enveloppes

L'enveloppe de succès `{ success, data, timestamp }` est décrite via un **décorateur OpenAPI
réutilisable** combiné à un **DTO métier explicite** :

```text
@ApiSuccessResponse(UserResponseDto)   // → schéma { success:true, data: UserResponseDto, timestamp }
```

Décision : **décorateurs réutilisables + DTO métier explicites** (pas de classe générique en
espérant que la réflexion Swagger la résolve). Les réponses `204 No Content` sont documentées sans
corps.

## 17. Erreurs

Schéma commun `ApiErrorResponseDto` : `success`, `statusCode`, `message`, `errorCode`, `details?`,
`path`, `timestamp`, **`requestId?`** (ajouté au contrat public, corrélation logs ADR-040). Statuts
documentés au minimum : **400** (validation), **401**, **403**, **404**, **409**, **413**, **429**,
**500**, **503**. Les codes applicatifs proviennent d'`error-codes.ts`.

## 18. operationId

**Convention `<domaine>_<actionCamelCase>`**, stable et indépendante du nom de méthode interne, via
un `operationIdFactory` :

```text
health_get  health_live  health_ready
auth_login  auth_refresh  auth_logout  auth_getProfile  auth_getAuthorization
files_upload  files_getMetadata  files_createDownloadUrl  files_delete  files_quarantine  files_restore
```

Retenue contre le pur camelCase (`authLogin`) car le préfixe de domaine évite les collisions et reste
lisible côté générateurs. **Tout renommage d'`operationId` est traité comme breaking** (§22).

## 19. Tags

Tags canoniques : `Health`, `Auth`, `Files`. Futurs : `Users`, `Roles`, `Permissions`, `Audit`.

## 20. Formats

`UUID` (`format: uuid`), `date-time`, **tailles `BigInt` en chaîne décimale** (`type: string`),
enums explicites, `multipart/form-data` (champ binaire `file` + champs), `format: binary`, sécurité
**Bearer**, **cookies** (web, futur), en-tête **`X-Request-Id`** documenté.

## 21. Génération des types

**`openapi-typescript`** : à partir du snapshot OpenAPI → types canoniques (paths, opérations,
composants), **runtime-indépendants**, publiés dans `@enistere/api-contracts`. Versions d'outils
**figées**.

## 22. Client Fetch

**`openapi-fetch`** consomme les types et fournit un client Fetch typé (path-based, faible runtime,
FormData natif). Les **wrappers Enistere** ajoutent base URL, `Authorization`/cookies, timeout,
parsing d'erreur, refresh coordonné. Publié dans `@enistere/api-client`. **Aucune dépendance Axios**
si cette stratégie Fetch est retenue.

## 23. TanStack Query

**Hooks maintenus dans les features Web/Mobile** (query keys contrôlées, invalidation métier,
orchestration explicite), au-dessus du client Fetch — **non générés** (évite le couplage fort au
générateur et les query keys génériques). Orval React Query reste une **option future** si sa
génération démontre une valeur nette.

## 24. Angular

**Types et contrat communs** ; **adaptateur Angular spécifique** (HttpClient/DI/interceptors/
Observables) autorisé via **Orval Angular** ou **OpenAPI Generator `typescript-angular`**, **décidé
par preuve dans le Web Core Angular**. On accepte « contrat commun, runtime client adapté » plutôt
que forcer Fetch dans Angular.

## 25. Flutter

**Aucun générateur Dart** maintenant. Le document OpenAPI reste **indépendant du TypeScript**
(`operationId` stables, schémas standards, pas de constructions inutilement complexes), permettant un
générateur Dart futur **décidé avec la spécification du Flutter Core**.

## 26. Multipart

Le contrat décrit `multipart/form-data` (champ binaire `file`). Règle client : **ne jamais forcer
`Content-Type: multipart/form-data`** — laisser `fetch` construire le boundary. Le runtime doit gérer
fichier binaire, `FormData`, champs enum/optionnels, et le format **React Native `{ uri, name, type }`**.
**Une solution qui casse l'upload React Native ne peut pas devenir le standard Mobile principal.**

## 27. Auth/refresh

```text
client généré  → transport d'une requête
wrapper Enistere → base URL, Authorization, cookies/credentials, timeout, parsing d'erreur,
                   refresh coordonné, retry unique, nettoyage de session
TanStack Query  → cache et mutations
```

Contraintes : **pas de refresh dupliqué** par endpoint, pas de **boucle** de refresh, **pas de retry
sur 403**, nettoyage de session centralisé, stockage adapté Web (cookies) / Mobile (Bearer +
SecureStore, ADR-015), **aucun token dans le code généré**.

## 28. Erreurs clientes

Le **wrapper Enistere normalise** toute réponse non-2xx vers un `ApiClientError` typé :
`status`, `errorCode`, `message`, `details?`, `requestId?`. La logique cliente **ne dépend jamais du
message humain** (utiliser `errorCode`). (Option retenue : erreur typée levée par le wrapper ; le
runtime du générateur ne décide pas seul.)

## 29. Versionnement

**Snapshot canonique versionné** (ex. `starters/nestjs/openapi/openapi.json`), **régénéré et
vérifié par CI** (diff Git, génération sans lancer l'API, base de publication). L'artefact courant
`openapi.json` reste **gitignoré** jusqu'à la mission d'implémentation. Distinguer explicitement :
`info.version` OpenAPI, version d'URL `/v1` (non utilisée aujourd'hui — pas de préfixe global),
**SemVer** du package API Core, version du client généré. Relation : `info.version` suit la version
du package API ; les packages de contrats/client sont versionnés en SemVer alignés.

## 30. Publication

**Package npm privé versionné** (ou artefact de release GitHub), **jamais** dépendance directe à
l'URL Swagger de production. Deux packages : **`@enistere/api-contracts`** (OpenAPI + types,
runtime-indépendant) et **`@enistere/api-client`** (Fetch + wrappers). Cohérent avec le monorepo
Fondation, les dérivés en repos séparés, GHCR/GitHub et le futur CI/CD (ADR-013).

## 31. Organisation des packages

**Contrats indépendants du runtime + adaptateurs clients séparés** : `@enistere/api-contracts`
(types/OpenAPI) ; `@enistere/api-client-fetch` (Fetch + wrappers) ; éventuel
`@enistere/api-client-angular` (adaptateur). Ainsi Flutter/Dart et d'autres consommateurs dépendent
du **contrat** sans adopter le runtime TypeScript.

## 32. Breaking changes

**Breaking** (au minimum) : suppression de route ; changement de méthode/path ; **renommage
d'`operationId`** ; suppression de champ ; champ optionnel devenu obligatoire ; changement
incompatible de type ; suppression d'une valeur enum ; réponse de succès modifiée ; changement
d'authentification ; nouveau statut obligatoire non géré ; modification incompatible de multipart.
**Compatibles** (généralement) : nouvelle route ; nouveau champ **optionnel** ; nouvelle réponse
d'erreur documentée ; nouvelle valeur enum (**avec prudence** selon les clients — les enums sont
traitées comme **fermées** côté contrat, et l'ajout de valeur est signalé comme potentiellement
impactant).

## 33. Validation et lint

Avant merge d'une évolution de contrat : **validation syntaxique** + **lint des conventions**
(Redocly CLI ou Spectral) + **détection de breaking changes** (`oasdiff`/`openapi-diff`) par
comparaison au snapshot canonique. Le choix outillé précis (Redocly vs Spectral, oasdiff vs
openapi-diff) sera figé à l'implémentation selon la maintenance ; les trois contrôles sont
**obligatoires**.

## 34. Tests

La mission d'implémentation devra prouver : génération **reproductible** (aucun diff après deux
générations) ; document valide ; **`operationId` uniques** ; DTO publics présents ; **aucun modèle
Prisma ni champ sensible** ; client TypeScript compilable ; login, refresh, `/auth/me`, **upload
multipart**, metadata fichier, URL signée, suppression ; **erreurs typées** ; en-tête
`X-Request-Id` ; compatibilité **Next.js** et **React Native** ; **aucun `Content-Type` multipart
forcé** ; intégration TanStack Query ; bundle raisonnable ; **aucune dépendance Axios** si la
stratégie Fetch est retenue.

## 35. Sécurité

Le document n'expose **aucun** modèle Prisma, secret, `passwordHash`/`tokenHash`, `storageKey`,
`bucket`, `checksum` ni metadata privée (cohérent ADR-007 / `FILES_REVIEW.md`). Pas de token dans le
code généré ni dans le contrat. Les URLs signées ne figurent jamais dans des exemples. Le contrat est
consommé via package versionné, **pas** via l'URL Swagger de production. `X-Request-Id` est un en-tête
de corrélation, **pas** une donnée de sécurité (ADR-040).

## 36. Conséquences positives

Contrat unique ; réduction de la duplication ; **typage bout en bout** ; détection précoce des
changements ; intégration Web/Mobile homogène ; compatibilité Fetch ; meilleure documentation ;
publication versionnée ; préparation Flutter ; tests contractuels ; productivité accrue des agents IA.

## 37. Conséquences négatives

Effort initial de DTO de sortie + décorateurs ; discipline OpenAPI continue ; gestion des versions ;
génération dans plusieurs repositories ; dépendances d'outillage (figées) ; risque de lock-in
(atténué par `openapi-typescript`/`openapi-fetch` à faible runtime) ; maintenance des wrappers ;
unions/enums délicates ; code généré à régénérer ; **nécessite la CI** (ADR-013).

## 38. Risques

Document incomplet ; DTO divergents ; modèles internes exposés ; `operationId` instables ; fichier
généré modifié manuellement ; clients non régénérés ; multipart cassé (RN) ; hooks trop couplés ;
breaking change non détecté ; enum incompatible ; package client non versionné ; refresh dupliqué ;
erreur non normalisée ; génération non reproductible ; divergence Angular/Web/Mobile ; artefact
construit depuis un environnement non fiable. Chaque risque est adressé par les sections §13–§35.

## 39. Règles pour les agents IA

- Ne **jamais** créer une interface cliente manuelle si elle existe dans le contrat.
- Ne **jamais** exposer Prisma ; ne **jamais** modifier un fichier généré (régénérer + vérifier le diff).
- Conserver les `operationId` ; ajouter un **DTO public explicite** par réponse ; documenter les erreurs.
- Tester le **multipart** ; ne **pas** forcer le `Content-Type` ; utiliser les **wrappers Enistere**.
- Ne **pas** implémenter un refresh par endpoint ; ne **pas** utiliser Axios sans exception documentée.
- Lancer **validation + lint + breaking-change checks** ; mettre à jour le CHANGELOG sur tout
  changement de contrat public.

## 40. Conditions de révision

Réviser si : passage **OpenAPI 3.1** ; changement majeur de `@nestjs/swagger` ; générateur retenu
abandonné ; passage à GraphQL/gRPC ; contrainte Flutter incompatible ; Angular renonce à son
adaptateur ; changement majeur du modèle TanStack Query ; upload direct signé devient standard ;
besoin de SDK publics multi-langages ; exigences réglementaires de versionnement.

## 41. Conclusion

Le contrat **OpenAPI produit par NestJS** devient la **source de vérité** versionnée des API
publiques. La chaîne retenue est **`@nestjs/swagger` → contrat canonique versionné → lint +
breaking-change detection → `openapi-typescript` (types) → `openapi-fetch` (client Fetch) → wrappers
Enistere → hooks TanStack Query maintenus dans les cores**, avec **Orval** en repli TypeScript, un
**adaptateur Angular** décidé par preuve, et un **générateur Dart** repoussé au Flutter Core. La
stabilisation préalable (DTO de sortie, décorateurs d'enveloppe, `operationId`, erreurs, formats) est
un prérequis. Cette ADR ne crée aucun code ni dépendance : elle cadre une stratégie de contrat et de
clients typés stable, multi-plateforme et cohérente avec ADR-003/011/012/040.
