# OPENAPI_CLIENT_PROOF.md — Preuve `openapi-typescript` + `openapi-fetch`

> **MISE À JOUR — Preuve VALIDÉE puis MIGRÉE.** La preuve décrite ci-dessous a confirmé la stack ;
> elle a ensuite été promue en **packages officiels** ([`packages/api-contracts`](../../../packages/api-contracts),
> [`packages/api-client-fetch`](../../../packages/api-client-fetch)). Le **code exécutable du proof a
> été retiré** (voir [`../proofs/openapi-client/README.md`](../proofs/openapi-client/README.md)) ; ce
> rapport est conservé pour sa valeur historique. Les chemins `proofs/openapi-client/*` ci-dessous
> décrivent l'état au moment de la preuve.

> Preuve technique (ADR-016) confirmant ou rejetant `openapi-typescript` + `openapi-fetch` comme
> **socle officiel des clients TypeScript Enistere**, généré depuis le contrat canonique
> `starters/nestjs/openapi/openapi.json`. **Aucun core client modifié, aucun Axios, aucun Orval installé.**

## 1. Contexte

ADR-016 décide la chaîne `contrat OpenAPI canonique → openapi-typescript → openapi-fetch → wrapper
Enistere → hooks TanStack Query (maintenus dans les cores clients)`, avec **Orval en repli** si la
preuve échoue structurellement. ADR-011 retient **Fetch** (Axios par exception) avec un wrapper
(auth/erreurs/timeout/refresh). ADR-012 garde les **hooks TanStack Query dans les cores** (jamais
générés). Cette preuve valide la faisabilité **avant** toute production de packages publiables.

## 2. Versions

| Outil | Version | Rôle |
|---|---|---|
| Node | 24.14.0 | runtime |
| npm | 11.9.0 | gestion paquets |
| `openapi-typescript` | 7.13.0 | génération des types (dev) |
| `openapi-fetch` | 0.13.8 | transport typé (runtime) |
| `typescript` | 5.9.3 | compilation stricte |
| `@types/node` | 24.13.1 | types Fetch/FormData (sans lib DOM) |

`npm audit` (package de preuve) : **0 vulnérabilité**. Aucune dépendance Axios/Orval (vérifié
`npm ls`). ESM (`type: module`), `module: nodenext` — compatible Node 24.

## 3. Architecture testée

`contrat openapi.json` → `openapi-typescript` → `src/generated/schema.ts` (types-only) →
`openapi-fetch` (`createRawApiClient`) → **wrapper `EnistereApiClient`** (Bearer, credentials,
timeout, X-Request-Id, `ApiClientError`, refresh single-flight + rejeu unique, `AuthSessionAdapter`)
→ exemples Next.js (serveur/navigateur) et React Native. **Hooks TanStack Query NON générés**
(ADR-012). Package isolé, non importé par l'application NestJS.

## 4. Génération

Commande `npm run generate` (script `scripts/generate.mjs`, API JS d'`openapi-typescript`) lisant le
**snapshot statique** (`file://`, jamais un serveur/`/docs`/URL de prod), en-tête statique « NE PAS
MODIFIER À LA MAIN », sortie `src/generated/schema.ts` (45 548 octets). Aucune base PostgreSQL/MinIO
requise pour générer.

## 5. Reproductibilité

Deux générations successives → **diff nul** (`diff -q` identique). `npm run generate:check` :
**RC 0** quand à jour, **RC 1** sur divergence simulée (puis **RC 0** après régénération). Génération
**déterministe** (en-tête sans timestamp, source statique).

## 6. Types générés

`paths`, `components`, `operations`, `webhooks`, `$defs` exportés. **14 operationId** présents et
uniques (`health_*`, `auth_*`, `files_*`). Vérifiés : DTO de sortie, **enveloppe de succès**
(`{ success, data, timestamp }`), **schéma d'erreur** `ApiErrorResponseDto`, enums fermées
(`"IMAGE" | …`, `"ACTIVE" | …`), **UUID `string`**, **`size` `string` (BigInt)**, **dates `string`**,
**multipart** (`file: string` binaire + `category` enum + `subjectId?`), **204** sans corps.

## 7. `openapi-fetch`

`createClient<paths>` typé ; `fetch` **injectable** (tests/SSR/RN), `baseUrl` explicite, `credentials`
par instance, jamais de référence à `window`. Résultat `{ data, error, response }` — la navigation
dans l'enveloppe se fait via `result.data.data` (sélection explicite, voir §18). `openapi-fetch`
détecte un corps `FormData` et **ne force pas** le `Content-Type` (boundary posé par la runtime).

## 8. Wrapper Enistere

`EnistereApiClient` : injection Bearer + X-Request-Id via **middleware** `onRequest` ; timeout par
requête (`AbortController`) ; normalisation réseau/timeout ; refresh **single-flight** + **rejeu
unique** ; méthodes typées pour les 14 opérations. Le wrapper **ne gère pas** le stockage des tokens,
les cookies, la navigation ni TanStack Query — délégués à l'`AuthSessionAdapter`/aux cores.

## 9. Authentification

`login`/`refresh`/`getProfile`/`getAuthorization` typés ; `Authorization: Bearer <token>` injecté
depuis l'adaptateur ; token **jamais** dans une URL, un log ou une erreur. `login` stocke les tokens
via l'adaptateur ; `logout` délègue le nettoyage à l'adaptateur (idempotent). `getAuthorization`
expose `roles[]`/`permissions[]` (résumé UI, jamais une preuve d'autorisation serveur).

## 10. Refresh coordonné

Refresh tenté **uniquement sur 401**, jamais sur 400/403/404/409/413/429/500/503. **Rejeu unique**
de la requête initiale (aucune boucle ; jamais sur `/auth/refresh` ni `/auth/login`). **Single-flight** :
deux 401 concurrents → **un seul** appel `/auth/refresh` puis deux rejeux. Échec de refresh → session
nettoyée **une seule fois** → `ApiClientError` `session_expired`. Tests : single-flight, rejeu unique,
nettoyage unique, absence de boucle.

## 11. Erreurs

`ApiClientError` (champs **whitelistés** : `kind`, `status`, `errorCode`, `message`, `details?`,
`requestId?`) construite depuis `ApiErrorResponseDto`. **Jamais** de token, de corps de fichier ni de
réponse brute conservés. `kind` distingue `http` / `network` / `timeout` / `invalid_response` /
`session_expired` — **une erreur réseau n'est jamais transformée en fausse 5xx**. `X-Request-Id` lu du
corps (prioritaire) et de l'en-tête.

## 12. Multipart Web

`uploadFile(Blob, category, { subjectId })` → `FormData` ; `Content-Type` **non forcé** (boundary
auto, vérifié : `multipart/form-data; boundary=…`, jamais `application/json`). Champs `file`,
`category` (enum), `subjectId` présents. Une **assertion unique** (corps `FormData` vs type objet
généré) est centralisée dans le wrapper, jamais dans le code généré.

## 13. Multipart React Native

Helper `createReactNativeUploadFormData({ uri, name, type }, category)` — descripteur RN routé sans
modifier le code généré ni forcer le `Content-Type`. **Différence d'environnement documentée** : le
`FormData` de Node (undici, strict WHATWG) refuse le descripteur RN, tandis que la **runtime React
Native l'accepte** (test de runtime simulé : `FormData` permissif → champ `file` = l'objet RN avec
`filename`). Ce n'est **pas** un défaut d'`openapi-typescript`/`openapi-fetch` (voir §18).

## 14. Compatibilité Next.js

- **Serveur** : factory **par requête** (`createApiClientForRequest`), `fetch` injectable, aucun
  accès `window`, **aucun client authentifié global partagé** entre requêtes/utilisateurs SSR
  (anti-pattern documenté dans l'exemple).
- **Navigateur** : `fetch` standard, `credentials: 'include'` optionnel (futur mode cookies),
  `crypto.randomUUID()` (natif), aucun module Node, aucun secret serveur embarqué.

## 15. Compatibilité React Native

Compile sous TypeScript strict **sans lib `DOM`** (types Fetch/FormData via `@types/node`, alignés
WHATWG — RN expose `fetch`/`FormData` globaux). Aucun `window`, aucun `Buffer`, aucun cookie imposé,
aucune dépendance Expo. Session injectée via un `SecureStoreLike` (interface seule). **Aucun Axios.**

## 16. Tests avec API réelle

Preuve LIVE (boîte noire, client **du build** contre PostgreSQL + MinIO jetables) — **16/16 étapes** :
login, profil, autorisations, **upload multipart**, metadata, **URL signée + GET HTTP réel** (octets
conformes), quarantaine/restauration, **suppression 204**, refresh, logout, et **401 / 403 / 404 /
413** + **X-Request-Id**. L'API valide la cohérence contenu↔catégorie (un JPEG doit être `IMAGE`) —
comportement serveur attendu, confirmé par le client typé.

## 17. Sécurité

Des sentinelles fictives (famille `PROOF_*_SECRET` : token d'accès, token de refresh, mot de passe,
URL signée — définies dans `test/security.test.ts`) sont **absentes** de toute `ApiClientError`
(sérialisation, `message`, `stack`) sur les chemins http/réseau/timeout/session — alors que le token
**a bien été envoyé** (preuve significative). Aucune sentinelle ni donnée sensible
(`passwordHash`/`tokenHash`/`storageKey`/`minioadmin`/`X-Amz-Signature`) dans l'artefact généré, le
README, ni la sortie de build (balayage statique).

## 18. Défauts / frictions (non structurels, ADR-016 §52)

1. **Navigation d'enveloppe** : il faut sélectionner `result.data.data` (centralisé dans le wrapper).
2. **Assertion multipart** : le corps `FormData` exige une assertion (types générés = objet) ;
   centralisée dans `multipart.ts`/`uploadFile`, jamais dans le code généré.
3. **`FormData` RN sous Node** : undici (strict) refuse `{uri,name,type}` ; RN l'accepte
   (différence d'environnement, contournée par le helper dédié).
4. **Types Fetch** : sans lib `DOM`, ils proviennent de `@types/node` ; un core navigateur strict
   ajoutera `lib: ["DOM"]` (sans impact contrat/wrapper).

**Aucun défaut structurel (ADR-016 §51)** : pas de modification du code généré requise, pas de
`Content-Type` forcé, erreurs interceptables, 204 géré, refresh coordonné possible, types exploitables,
pas de singleton SSR imposé, RN sans Axios.

## 19. Verdict

✅ **PREUVE CONCLUANTE.** `openapi-typescript` (types) + `openapi-fetch` (transport) + wrapper Enistere
constituent un socle **viable** pour les clients TypeScript Enistere : génération déterministe et
vérifiable, typage strict de bout en bout (Web serveur/navigateur **et** React Native), enveloppes et
erreurs fiables, refresh coordonné sûr, multipart Web/RN sans modifier le généré, et **16/16** contre
une API réelle. Les frictions sont mineures et attendues (§18). **Orval n'est pas nécessaire** (repli
non déclenché).

## 20. Décision pour les packages définitifs

Adopter la chaîne ADR-016 pour les packages définitifs (étape ultérieure, **hors de cette preuve**) :

- **`@enistere/api-contracts`** : contrat + types `openapi-typescript` (générés depuis le snapshot).
- **`@enistere/api-client-fetch`** : `openapi-fetch` + wrappers (reprendre `ApiClientError`,
  `AuthSessionAdapter`, refresh single-flight, helpers multipart de la preuve).
- **Hooks TanStack Query** : maintenus **dans les cores Web/Mobile** (ADR-012), jamais générés.
- **CI (ADR-013, hors `starters/nestjs/`)** : `generate:check` + détection de breaking changes
  (oasdiff/openapi-diff) avant merge ; publication GitHub Packages.
- Conserver les conventions prouvées : `fetch` injectable, factory de client par requête (SSR),
  jamais de `Content-Type` multipart forcé, aucun token dans logs/erreurs, **aucun Axios**.
