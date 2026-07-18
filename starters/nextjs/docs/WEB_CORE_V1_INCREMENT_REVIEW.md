# Revue globale Web Core — incrément V1

> Revue **transverse de stabilisation** du Web Core Next.js traité comme **un système unique** (Health
> public → BFF Auth → session/autorisations → layout protégé → login → états UI → Files lecture/
> téléchargement), **sans aucune nouvelle fonctionnalité**. Le repository réel prime sur les rapports
> antérieurs. Date : 2026-06-10.

## 1. Commit revu

`2afd31e feat(web-nextjs): add secure file read access` (HEAD = `origin/main`, working tree propre au
démarrage). Historique pertinent : `16f9eeb` (UI 1) · `37f2114` (revue Auth V1) · `447e3b5` (login) ·
`29817b2` (layout protégé) · `9ed74b2` (gouvernance) · `614c087`/`89d5808`/`f924643`/`d665387`/`bcdf0b2`
(Auth/API/starter). Cette revue ajoute le commit `docs(web-nextjs): review web core v1 increment`.

## 2. Périmètre

Inclus : vérification fichier par fichier, rejeu des validations (×2), rejeu runtime réel (PostgreSQL +
MinIO jetables), analyse des frontières, détection de duplications/contradictions, classement des dettes,
verdict, rapport permanent, une seule prochaine action. **Exclus** (respecté) : toute nouvelle
fonctionnalité (Files 2, middleware, upload/suppression Web, nouveau composant UI, CI, Docker). **Non
modifiés** : `starters/nestjs/`, `starters/react-native/`, `deployment/core/`, `packages/ui-kit/`,
`packages/`, `docs/adr/`, `strategy/`.

## 3. Architecture

Découpage **`app/` → `features/` → `core/` + `shared/`** respecté. Aucun import inversé (`core/`/`shared/`
n'importent jamais `features/`/`app/` ; `features/` n'importe jamais `app/`). Server Components par défaut ;
16 modules `"use client"`, tous justifiés (hooks TanStack Query, état/handlers de formulaire, `error.tsx`).
Aucun fichier mort, aucun barrel dangereux (`core/auth/server/index.ts` n'exporte que des entrées serveur),
composants bornés (max ~141 lignes : `login-form.tsx`).

## 4. Routes

Build (`next build --webpack`) — 14 routes, **statiques** seulement `/_not-found` et
`/manifest.webmanifest` ; **dynamiques (`ƒ`)** : `/`, `/login`, `/protected`, `/protected/files/[id]`,
`/api/auth/{authorization,csrf,login,logout,me,refresh}`, `/api/files/[id]`,
`/api/files/[id]/download-url`. Toutes les routes Auth/Files et les pages privées sont `force-dynamic` →
**build indépendant de l'API**.

## 5. Server / Client Components

Frontière nette. Les pages/layouts privés et les Route Handlers sont des Server Components `force-dynamic`.
Les conteneurs interactifs (`FileDetails`, `LoginForm`, `SessionPanel`, hooks) sont `"use client"`. Aucun
secret ni `next/headers` atteignable depuis un module client (test statique, cf. §9).

## 6. Clients API

Six clients, responsabilités disjointes : (1) **public navigateur** (`core/api/public`, `NEXT_PUBLIC_API_URL`,
sans session/Bearer/refresh) ; (2) **serveur public** (`core/api/server/create-server-api-client`,
`enableRefresh:false`) ; (3) **serveur authentifié read-only** ; (4) **serveur authentifié writable** (refresh
BFF coordonné) — (3)/(4) via `create-authenticated-server-api-client` ; (5) **BFF Auth navigateur**
(`core/auth/client`, same-origin `/api/auth/*`) ; (6) **BFF Files navigateur** (`core/files/client`,
same-origin `/api/files/*`). Aucun ne mélange ses responsabilités ; les clients navigateur n'injectent **aucun
Bearer** et ne lisent **aucun cookie/token**.

## 7. BFF

BFF **ciblé**, jamais un proxy générique. `GET /api/files/:id` (read-only) et `POST /api/files/:id/download-url`
(writable) n'acceptent que l'**UUID du chemin** ; jamais d'URL/bucket/storageKey/TTL/headers fournis par le
client. Ordre de garde : méthode (405) → **UUID** (400, aucun appel API) → [POST : **Origin/Referer + CSRF**
(403, aucun appel API)] → API. Réponses **normalisées** (`jsonOk`/`jsonError`, `Cache-Control: no-store` +
`Pragma: no-cache` systématiques), génériques (jamais la réponse API brute), `X-Request-Id` propagé, **aucun
token renvoyé**.

## 8. Configuration

`core/config/api-url.normalizeApiBaseUrl` : http/https, URL absolue, **credentials interdits**, **wildcard
rejeté**, trailing slash normalisé. `server-config` (API_INTERNAL_URL) **serveur uniquement** ; `public-config`
ne lit que `APP_ENV` + `NEXT_PUBLIC_*`. `allowed-origins` : comparaison **exacte** scheme+host+port,
**fail-closed** si Origin et Referer absents. En-têtes (`next.config.ts`) : `X-Content-Type-Options:nosniff`,
`Referrer-Policy:strict-origin-when-cross-origin`, `X-Frame-Options:DENY`, `X-DNS-Prefetch-Control:off`,
`Permissions-Policy`, `poweredByHeader:false`. **Correction de revue** : `.env.example` complété avec
`WEB_ALLOWED_ORIGINS` (auparavant absent — onboarding fail-closed) ; `SECURITY.md` corrigé (routes protégées
implémentées, posture Files ajoutée).

## 9. Build & frontières client/serveur

`typecheck` + `lint` + `build` verts. `test/auth-boundaries.test.ts` (statique) déclare l'ensemble
**CLIENT_REACHABLE** et interdit dans le client : `next/headers`, `server-config`, `core/auth/server/*`,
`core/auth/handlers/*`, `core/auth/http/*`, `core/auth/csrf/*`, `core/api/server/*`, **`core/files/handlers/*`,
`core/files/http/*`** et `API_INTERNAL_URL`. Vérifié : `core/files/client/*` est client-reachable ; les
handlers/http Files sont interdits côté client ; aucun barrel ne réexporte du code serveur vers un chemin
client. **Dette build-order** : `packages/*/dist` non versionnés (gitignore) → un clone neuf doit builder les
paquets **avant** le Web (aucune CI ne l'impose — ADR-013).

## 10. Sécurité HTTP

En-têtes de base présents (§8). **Différés (documentés)** : **CSP** (à nonces, V2 — une CSP incomplète
donnerait une fausse protection), **HSTS** (dépend du TLS de déploiement → Cloud), **COOP/CORP**. Aucun
`X-Powered-By`. Pas de middleware (choix assumé : un middleware ne prouve pas l'authentification ; l'API reste
l'autorité).

## 11. Health

Client serveur **par requête** + client navigateur **public** ; aucune session, aucun Bearer, aucun refresh.
Préchargement SSR optionnel (`API_INTERNAL_URL`) → `HydrationBoundary` → `HealthPanel` (même clé `healthKeys`).
Désactivé (`enabled:false`) tant que l'URL d'API est absente (aucune requête). `readiness` plus prudent
(`retry:false`).

## 12. Auth

Invariants Auth V1 (revue `WEB_AUTH_V1_REVIEW.md`) **non cassés** par UI 1 ni Files 1. Runtime rejoué (×2) :
anonyme `/protected` → **redirection `/login`** ; login BFF (sans token lu) → `/protected` **200** ; `/me`
**200 sans token** ; **refresh** (rotation) **200** ; logout → `/protected/files` **redirige `/login`**.
`returnTo` anti open-redirect (couvert par tests + runtime Auth V1).

## 13. Cookies / CSRF

Cookies `HttpOnly` access/refresh (`__Host-` en prod), jamais renvoyés au navigateur. **CSRF double-submit**
(cookie non-HttpOnly + `X-CSRF-Token`, comparaison temps constant, rotation login/refresh, suppression au
logout). `checkOriginAndCsrf` valide Origin (sinon Referer, **fail-closed**) **puis** CSRF, **avant tout appel
API**. Appliqué identiquement aux mutations Auth **et** à `POST /download-url`.

## 14. Session / cache Auth

`resolveServerSession` **read-only** (`enableRefresh:false`) : `401`→anonymous ; `403`/réseau/`5xx`/réponse
invalide→**unavailable** (jamais anonyme) ; aucune écriture cookie (`guardReadOnly`), aucun self-fetch.
`authKeys` disjoints, `retry:false`, **sans persistance** ; **purge** `authKeys.all` au login et au logout
(Health **et Files conservés**) ; échec réseau au logout → **pas de purge**. Hydratation du profil au layout
(`prefillSessionQuery`, aucun second `/me`).

## 15. États UI

Répartition correcte : **UI Kit** = primitives génériques (`Alert`/`Card`/`FormField`/…) ; **Web Core** =
états applicatifs (`LoadingState`/`EmptyState`/`ErrorState`/`UnauthorizedState`(401)/`ForbiddenState`(403)/
`ServiceUnavailableState`/`PageHeader`). `403 ≠ 401 ≠ 404 ≠ 503` strictement distincts ; permissions **non
révélées** ; `requestId` correctement placé (états d'erreur/indisponibilité). Une page = **un `h1`**
(`PageHeader` par défaut). Pas de nouveau composant ajouté par cette revue.

## 16. Files — métadonnées

Chaîne complète vérifiée : page privée `/protected/files/[id]` → `FileDetails` (hooks inconditionnels puis
branchement) → `useFileMetadata` → BFF `GET /api/files/:id` → client serveur **read-only** → API → contrat
**public** `PublicStoredFileDto` → rendu `FileMetadataView`. `no-store`, `retry:false`, `enabled` si UUID
valide. **Aucun champ interne** (storageKey/bucket/checksum/ownerId) ; `originalName` rendu en **texte**
(aucun `dangerouslySetInnerHTML`).

## 17. Files — téléchargement

`useCreateDownloadUrl` = **mutation** : `getCsrfToken()` → `POST /api/files/:id/download-url` (Origin/Referer +
CSRF, client serveur **writable**) → `SignedDownloadResponseDto {url, expiresAt}` → `triggerDownload`
(`isSafeDownloadUrl` **https**-only ; http seulement en contexte non-TLS dev/test ; `javascript:`/`data:`/
relatif refusés) → ancre temporaire `rel="noopener noreferrer"`, retirée. `mutationFn` retourne **`void`**.
Anti-double-clic (`useRef`). `canDownload` = `status==='VALIDATED' && hasPermission('files.download')`
(**affichage seul** ; l'API revérifie).

## 18. Erreurs Files

Mapping **distinct** (`core/files/http/files-response.ts`) — vérifié au runtime : **400** UUID · **401**
session · **403** permission · **404** absent/non-propriétaire (anti-énumération) · **409** non téléchargeable
· **429** limite · **503** stockage · **502** réseau BFF→API · **504** timeout. Préserve **404** (≠ le mappeur
Auth `web-response.errorResponse` qui collapse 404→500 — d'où un mappeur Files dédié, justifié).

## 19. Cache Files

`fileMetadataQueryOptions` : `staleTime` 30 s, `gcTime` 5 min, `retry:false`. **Fenêtre d'obsolescence
documentée** : après changement de droits ou suppression/quarantaine côté API, les métadonnées en cache
peuvent rester affichées jusqu'au prochain `staleTime`/refetch ; **l'API reste l'autorité** (le téléchargement
est revérifié et échoue en 403/404/409). Le cache Files **n'est pas purgé** au logout par `authKeys` (espaces
disjoints) — acceptable car (a) le rendu privé est gardé par le layout serveur, (b) aucune donnée sensible
n'y figure ; option d'amélioration : purger `fileKeys` au logout (dette mineure, §49).

## 20. URL signée

**Jamais** mise en cache (query/mutation), journalisée, placée dans une erreur, une clé, `localStorage`/
`sessionStorage`. Consommée immédiatement (`triggerDownload`) puis abandonnée. Scans runtime : absente des
réponses BFF (hors `download-url`), des logs API, du bundle `.next/static`. Autorisée seulement dans la
réponse `download-url` et la requête **directe** au stockage.

## 21. TanStack Query

`createQueryClient()` : un client **navigateur stable** (`useState` dans le provider), un client **serveur par
rendu** (aucun singleton serveur). `staleTime`/`gcTime` explicites et cohérents. Timers GC nettoyés en tests.

## 22. Query keys

`healthKeys` / `authKeys` / `fileKeys` : stables, sérialisables, **disjoints** (racines `["health"]` /
`["auth"]` / `["files"]`) ; aucun secret, token ni URL signée (seul l'UUID admis pour `fileKeys.detail`).
Purger un espace n'affecte jamais les autres.

## 23. Retries

Matrice (vérifiée) : **4xx (400/401/403/404/409/413/429) → jamais** ; **5xx / réseau / timeout → borné
(`MAX_QUERY_RETRIES=2`)** ; `session_expired`/non-`ApiClientError` → jamais. **Divergence intentionnelle et
documentée** : Health utilise la politique par défaut (retry borné sur 5xx/réseau/timeout) ; **Auth et Files
imposent `retry:false`** (un 401/404 est une réponse normale ; les erreurs transitoires sont réessayées par
action explicite/`onRetry`). **429 non réessayé** (pas de stratégie `Retry-After` en V1 — dette mineure).

## 24. Contrats OpenAPI

`generate:check` **up-to-date** ; aucun DTO recopié. Types via `SchemaOf<>` : `HealthResponseDto`/`Liveness`/
`Readiness`, `UserProfileResponseDto`, `AuthorizationSummaryResponseDto`, **`PublicStoredFileDto`**,
**`SignedDownloadResponseDto`**. Les décisions de comportement s'appuient sur `status`/`errorCode`/`kind`/
`requestId` — **jamais** sur le texte de message (vérifié sur les 6 mappeurs d'erreurs).

## 25. Accessibilité

`PageHeader` rend un `h1` par défaut ; **un `h1` par page** (accueil, `/login`, `/protected`,
`/protected/files/[id]`). Labels/`aria-describedby`/`aria-invalid`/`role=alert|status` présents (login,
métadonnées). **jest-axe** couvre `FoundationStatus`, états UI (`Empty`/`Unauthorized`/`Forbidden`/
`ServiceUnavailable`/`PageHeader`), `LoginForm`, `FileMetadataView`. **Lacunes** (dette mineure) :
`shared-states.test.tsx` (Loading/Error/NotFound) sans `axe` (couverts ailleurs) ; pas d'axe sur les
**conteneurs** `FileDetails`/`LoginPanel`/`SessionPanel` (vues composées couvertes au niveau présentationnel).
**Contrastes** : non mesurés instrumentalement (axe ne garantit pas le ratio sur tokens) → dette ouverte.

## 26. Performance

Composants clients minimaux et justifiés ; aucune bibliothèque lourde côté client (ni Tailwind/Radix/shadcn,
ni Axios/Zustand). Le fichier **n'est jamais proxifié** par Next.js (téléchargement direct navigateur →
stockage). Aucun buffer de fichier, aucune URL signée persistée, aucun cache utilisateur global, aucun
stockage de mot de passe (scans §43).

## 27. Requêtes par page (conceptuel)

`/` : serveur = 0/1 préchargement Health (si `API_INTERNAL_URL`) ; navigateur = 1 Health (si configuré),
sinon 0. `/login` : serveur = 1 résolution session ; navigateur = 0 (sauf soumission → 1 CSRF + 1 login).
`/protected` : serveur = 1 résolution session (puis hydratation, **aucun second `/me`**). `/protected/files/[id]`
: serveur = 1 résolution session (layout) ; navigateur = 1 métadonnées (+ 1 CSRF + 1 download-url **à la
demande**). Aucun appel doublé observé.

## 28. Runtime réel

Environnement **jetable** (PostgreSQL + MinIO conteneurs, utilisateurs + fichiers VALIDATED **éphémères**,
démonté) — **49/49 comportements corrects** (50 assertions, 1 faux positif de sonde résolu, §45). **Parcours
critique Auth + Files rejoué ×2** (RUN1/RUN2 identiques). Détails §36-§42.

## 29. Concurrence

Vérifié au runtime : **double login concurrent** (même jar) → session propriétaire valide ensuite (200) ;
**double `download-url` concurrent** → 200/200 (BFF sans état ; anti-double-clic = garde client `useRef`,
testée unitairement) ; **deux cookie jars** → isolation stricte (propriétaire 200 / autre 403). Refresh
concurrent / logout-pendant-refetch : coordination du refresh assurée par `api-client-fetch` + purge logout ;
non-déterministes en sondage curl, **couverts par tests unitaires**. Aucune corruption observée.

## 30. Répétitions

Suite Web `node:test` exécutée **2 fois** : **307 / 307** (durées 10,1 s puis 9,9 s, **aucun hang**, aucun
handle ouvert). Parcours runtime critique (Auth+Files) **rejoué 2 fois** dans le même environnement : résultats
identiques.

## 31-32. Scans (source, bundle/HTML/RSC)

**Source** : `accessToken`/`refreshToken` uniquement dans l'adaptateur serveur/handlers/types/commentaires ;
`storageKey`/`bucket`/`checksum` **uniquement en commentaires** (documentant la non-exposition) ;
`Authorization` = concept RBAC (jamais un en-tête Bearer client) ; `password` = formulaire/validation login ;
**aucun** `localStorage`/`sessionStorage`/`eval`/`new Function`/`innerHTML`/`console.*` ; `dangerouslySetInnerHTML`
cité en commentaire « non utilisé ». **Artefacts runtime** : métadonnées BFF sans storageKey/bucket/checksum/
signature/credentials ; logs API sans URL signée ni credentials ni secret ; `.next/static` sans
`X-Amz-Signature`/`minioadmin`/secret ; `/me` sans token/mot de passe.

## 33. Tests

**307** tests `node:test` (Web) verts ×2 ; UI Kit **78** (100 %) ; api-contracts **11** ; api-client-fetch
**29**. Frontières d'import (statique), CSRF temps constant, isolation A/B, sentinelles de fuite, mappeurs
d'erreurs, hydratation, états UI + axe, Files (handlers/clients/hooks/format/download/erreurs).

## 34. Couverture

Web ≈ **87,84 %** lignes / **88,43 %** branches / **83,22 %** fonctions. Modules `files/` : 96–100 %.
`use-health.ts` partiellement couvert (chemins `enabled:false` non instanciés — attendu). UI Kit 100 %.

## 35. Synthèse des défauts détectés

**Aucun défaut bloquant. Aucun défaut important.** Aucune fuite de token/URL signée/donnée privée ; frontière
client/serveur intacte ; Auth cohérente ; pas d'open redirect ; CSRF complet ; pas de cache inter-utilisateur ;
URL signée non persistée ; contrats non divergents ; tests stables.

## 36-42. Détail runtime (rejoué)

- **Public** (§36) : `GET /` **200** (API up) ; `GET /` **200** (API down) ; API `live`+`ready` **200**.
- **Auth** (§37) : anonyme `/protected`→`/login` ; login owner ; `/protected` **200** (contenu privé) ;
  `/me` **200** sans token ; **refresh 200** (rotation) ; logout → `/api/files/:id` **401** + `/protected/files`
  → `/login`.
- **Files** (§38) : propriétaire métadonnées **200** (publics, no-store, sans champ interne) ; `download-url`
  **200** `{url,expiresAt}` ; **téléchargement réel MinIO** (octets == upload, `image/png`) ; **signature
  altérée → 403** ; **URL réellement expirée (TTL 30 s) → 403**.
- **Droits** (§39) : sans `files.read` → **403** ; non-propriétaire **avec** permission → **404** ;
  **révocation de rôle sans nouveau JWT** → `/authorization` reflète la perte → `GET file` **403** ;
  quarantaine → `download-url` **409** ; objet supprimé → **503**.
- **Pannes** (§40) : **MinIO arrêté** → `download-url` **503** (≠ 404) ; **API arrêtée** → `GET /` **200**
  (indépendance build) + `/protected` rend l'**état « Service indisponible »** (≠ anonyme, **aucun contenu
  privé visible**, **aucune donnée utilisateur** dans la charge utile) + `GET /api/files/:id` **502**.
- **Concurrence** (§41) : cf. §29.
- **Répétitions** (§42) : cf. §30.

## 43. Scan source — voir §31.
## 44. Scan bundle/HTML/RSC — voir §32.

## 45. Note sur l'unique faux positif de sonde

La sonde initiale « contenu privé sous API down » a échoué par un **grep trop large** : elle cherchait le
libellé statique « Accès protégé validé » dans **tout** le HTML, ce qui a matché son occurrence **échappée dans
la charge utile RSC** (`\"children\":\"Accès protégé validé\"`). Re-test ciblé (API **hard-killée** + attente
de l'injoignabilité confirmée) : la **vue rendue visible** est l'état « Service indisponible » (le layout
`(protected)/layout.tsx:34-40` **retourne tôt** `ServiceUnavailableView` sans rendre `{children}`) ; le libellé
n'apparaît **pas** comme texte DOM rendu (`>Accès protégé validé<` : 0) ; et **aucune donnée privée** (e-mail
utilisateur : 0 occurrence) ne figure dans la réponse. Conclusion : **pas un défaut** — comportement documenté
(indisponible ≠ anonyme, aucun contenu privé), conforme à la revue Auth V1 (33/33). Le libellé statique présent
dans la charge RSC est un artefact de sérialisation Next.js sans valeur sensible (il est déjà dans le bundle).

## 46. Corrections appliquées (revue)

Documentaires/onboarding uniquement, **zéro changement de comportement** : (1) `.env.example` — ajout de
`WEB_ALLOWED_ORIGINS` (commenté + avertissement fail-closed) ; (2) `SECURITY.md` — routes protégées marquées
implémentées (étaient listées « reporté V2 »), posture Files ajoutée, COOP/CORP listés en V2. Non-régression
re-jouée (307 ×2 + build).

## 47. Dettes bloquantes

**Aucune.**

## 48. Dettes importantes

1. **Aucune CI** (ADR-013) — non-régression et **ordre de build monorepo** (`packages/*/dist` non versionnés)
   reposent sur l'exécution manuelle. Risque sur clone neuf / futur pipeline.
2. **Aucun E2E navigateur permanent** — flux couverts au niveau handler/transport + preuve runtime rejouée,
   mais pas de parcours navigateur automatisé pérenne.

## 49. Dettes non bloquantes

CSP à nonces (V2) · HSTS (déploiement TLS) · COOP/CORP · rate limiting au niveau BFF (l'API limite déjà) ·
journalisation/observabilité Web · **429 non réessayé** (pas de `Retry-After`) · redirections en **streaming**
(HTTP 200 + `NEXT_REDIRECT`/meta-refresh) · **multi-onglets** + fenêtre `staleTime` · **cache Files non purgé
au logout** (espaces disjoints ; sans impact sécurité, purge `fileKeys` envisageable) · `shared-states.test.tsx`
sans axe · pas d'axe sur conteneurs `FileDetails`/`LoginPanel` · **contrastes** non mesurés instrumentalement ·
patchs disponibles (`next 16.2.7→16.2.9`, `eslint-config-next`) non appliqués · primitives UI interactives
absentes (Dialog/Select/Toast) · upload/suppression Files Web absents (volontaire).

## 50. Risques post-V1

CSP/HSTS à introduire avec le déploiement (Cloud Core) ; rate limiting/observabilité BFF ; SSR Auth complet ;
durcissement multi-onglets ; publication des packages (ADR-016) ; primitives UI interactives (UI Kit 4) avant
features riches.

## 51. Rapport permanent

Ce document (`starters/nextjs/docs/WEB_CORE_V1_INCREMENT_REVIEW.md`). Complète
`WEB_CORE_GOVERNANCE_REVIEW.md` (socle) et `WEB_AUTH_V1_REVIEW.md` (Auth) en couvrant l'incrément **complet**
(Health + Auth + UI + Files) comme un système unique.

## 52. Verdict

**`WEB_CORE_V1_INCREMENT_STABLE_WITH_RESERVATIONS`.** Aucun défaut de sécurité bloquant ; architecture
cohérente ; sécurité confirmée (token/URL signée/donnée privée jamais exposés ; CSRF + Origin/Referer ;
indisponible ≠ anonyme ; 404 anti-énumération ; droits dynamiques sans nouveau JWT) ; parcours runtime
fiables (rejoués ×2, 49/49) ; tests stables (307 ×2). **Réserves opérationnelles importantes** : CI + ordre de
build, E2E navigateur permanent ; **réserves mineures** : CSP/HSTS, contrastes, 429, cache Files au logout.

## 53. Statut Web Core

**`IMPLEMENTATION_PARTIELLE`** — **inchangé**. Un verdict d'incrément réussi **n'augmente pas** le statut du
core (critères officiels du checkpoint requis : périmètre fonctionnel complet V1, CI, E2E — non réunis).

## 54. Éléments absents (attendus, non bloquants)

Upload/suppression/admin Files Web · liste/recherche/pagination · prévisualiseur · middleware · CSP/HSTS ·
CI/CD · Dockerfile · E2E navigateur · primitives UI interactives · Mobile Core · publication des packages.

## 55-56. Prochaine action (unique) + justification

**CI minimale (ADR-013)** — pipeline imposant l'**ordre de build des paquets** (`api-contracts` →
`api-client-fetch` → `ui-kit` → `web-nextjs`), `typecheck`/`lint`/`test` (Web + UI Kit + paquets) et
`openapi:generate:check`, en non-régression monorepo. **Justification** : l'**absence de CI + l'ordre de build**
sont la **principale réserve transverse** de toutes les revues (gouvernance, Auth V1, et la présente) ; elle
est la seule **dette importante** qui menace la non-régression et la reproductibilité (clone neuf). Files 2 /
UI Kit 4 / Mobile **augmentent** la surface sans réduire ce risque ; les sécuriser **après** la CI est plus sûr.
Option subsidiaire (décision humaine) : UI Kit 4 si des features riches sont imminentes. **Ne pas** démarrer
Files 2 tant que la non-régression n'est pas outillée.

## 57. Checkpoint

Mis à jour : `FOUNDATION_CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`, `DECISIONS_REGISTER.md`,
`NEXT_ACTIONS.md`, `SESSION_HANDOFF.md`, `README.md` racine, `CHANGELOG.md` — verdict, statut inchangé, dettes,
**prochaine action unique = CI minimale**, commit revu, preuves exécutées.

## 58-62. Non-régression / audit / git

Non-régression (§30, §33-34) : Web `check` (typecheck+lint+307 ×2+build) + couverture ; UI Kit
(tokens:check/typecheck/build/lint/test/coverage 100 %/pack:check) ; paquets (generate:check/typecheck/build/
test). **Audit** : `npm audit` **0 vulnérabilité** ; Axios/Zustand **absents** ; React/React-DOM **19.2.7** ;
`@tanstack/react-query` **5.101.0** ; Next **16.2.7** (patch 16.2.9 disponible, non appliqué). **Git** : commit
`docs(web-nextjs): review web core v1 increment` ; push `origin/main` **fast-forward**, jamais de force-push ;
working tree final propre.
