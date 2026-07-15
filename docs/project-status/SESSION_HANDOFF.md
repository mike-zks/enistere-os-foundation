# SESSION_HANDOFF.md — Transfert de session (compact)

> Document court et exploitable pour démarrer une nouvelle conversation / un autre agent.
> **Source de vérité = le repository**, résumé par `docs/project-status/`. Vérifié le 2026-07-12.

## Bloc de démarrage (à copier en début de session)

```
Nous poursuivons Enistere OS Foundation.
Les fichiers du dossier docs/project-status/ sont la source officielle
de vérité. Lis-les avant toute recommandation et ne suppose aucune
implémentation absente de la matrice.
```

## 1. Projet

Enistere OS Foundation — monorepo de socles (cores) techniques + packages partagés + stratégie/ADR.

## 2. Objectif courant

Faire progresser les cores V1 **un par un**, en s'appuyant sur le API Core et les packages déjà
disponibles, sans régression et sans confondre spécification et implémentation.

## 3. État réel (résumé)

- **VALIDE_V1** : **API Core NestJS** (auth, sessions, refresh, RBAC, permissions, audit, files
  S3/MinIO dont `GET /files` paginé, logging Pino, OpenAPI canonique) — **386 tests unitaires**
  + e2e CI runtime + rapports permanents. Promotion réalisée le 2026-07-12 :
  `API_CORE_V1_READINESS_REVIEW.md`.
- **Foundation baseline** : **FOUNDATION_V1_RELEASED** (2026-07-12) — tag `foundation-v1.0.0`,
  commit `2981f2c`, GitHub Release publiée.
- **Release notes** : **FOUNDATION_V1_RELEASED** — `FOUNDATION_V1_RELEASE_NOTES.md` publié.
- **Quality Core** : **VALIDE_V1** (2026-07-13) — `QUALITY_CORE_V2_READINESS_REVIEW.md` +
  `QUALITY_CORE_ADVANCED_READINESS_REVIEW.md` + `QUALITY_CORE_RELEASE_HELPER_REPORT.md` +
  `QUALITY_CORE_COVERAGE_REPORTING_BASELINE.md` + `QUALITY_CORE_V1_READINESS_REVIEW.md`.
  Le core dépasse la seule spécification : gates, script, checklists, templates, ruleset actif,
  release process, prompts IA standardisés, usage réel lors de `foundation-v1.0.0` et integration du gate
  documentaire via Docs Core. `release-helper.mjs` prépare des brouillons Markdown stdout-only sans tag ni
  GitHub Release. `quality-report.mjs` synthétise les gates tests/couverture stdout-only sans lancer les tests.
  Les automatisations avancees restent differees vers V2/VF.
- **Cloud Core** : **VALIDE_V1** (2026-07-12) — `CLOUD_CORE_V1_READINESS_REVIEW.md` +
  `CLOUD_CORE_12_REDIS_COMPOSE_DECISION.md`. CC10/CC11 prouvent un staging HTTPS reel operationnalise
  (health, auth/files, backups/restores, rollback/roll-forward, rotation smoke, runbooks). CC12 reporte Redis
  post-V1/V2 et fait de `docker-compose.cc10.yml` le compose serveur/staging V1 officiel. Les tests serveur
  reels restent des gates finaux, pas des checks de chaque mission.
- **Docs Core** : **VALIDE_V1** (2026-07-12) — `cores/docs-core/CORE_SPECIFICATION.md`,
  `cores/docs-core/README.md`, `docs/README.md` index central, `DOCS_CORE_NAVIGATION_AUDIT.md`,
  `docs/onboarding/CONTRIBUTOR_ONBOARDING.md` avec parcours par role, `docs/glossary/GLOSSARY.md`,
  `docs/guides/DOCUMENTATION_MAINTENANCE_GUIDE.md`, `docs/guides/CORE_STATUS_REVIEW_GUIDE.md`,
  `cores/docs-core/scripts/check-doc-links.mjs` + test, `DOCS_CORE_V2_READINESS_REVIEW.md`,
  `DOCS_CORE_GUIDES_ONBOARDING_REPORT.md`, `DOCS_CORE_CI_GATE_DECISION.md`,
  `DOCS_CORE_V1_READINESS_REVIEW.md`. Link check integre au scope local `quality-gates docs`;
  aucun workflow/ruleset modifie. Aucun runtime/dependance/RAG/site docs.
- **VALIDE_V1** : **UI Kit** (`@enistere/ui-kit`, **0.1.1**, privé) — design tokens **+ 19 primitives Web React**
  (Button, Input, Label, Text, Spinner, VisuallyHidden + Alert, Card, FormField + Dialog, Select, Toast — UI Kit 4 +
  Badge, Divider, Skeleton — UI Kit 5 + **LoadingState, EmptyState, ErrorState, SuccessState** — UI Kit 6) pilotées par tokens, accessibles. React = peerDependency `>=18` ; **aligné et testé sous React 19**
  (**181 tests**, jest-axe). CSS via `@enistere/ui-kit/styles.css`. `Dialog` est marqué `'use client'` pour la
  compatibilité Next Server Components. **Tailwind/Radix/shadcn absents** (ADR-009 partiel — intentionnel).
  Statut : **VALIDE_V1** (promotion 2026-07-11 depuis `IMPLEMENTATION_AVANCEE`) ; **consommé par le Web Core VALIDE_V1** ; cohérence mobile/web prouvée par RN35 (tokens verbatim + 13 tests). §12.4 4/4 + §59 9/9. Réserves non bloquantes : Storybook différé, composants avancés V2/VF, composants RN dans Mobile Core (ADR-010).
- **VALIDE_V1** : **Web Core** (`@enistere/web-nextjs`, 0.1.0, privé) — **Next 16 App Router + React 19**,
  TypeScript strict, Server Components par défaut, UI Kit consommé, thème clair via `data-theme`,
  en-têtes sécurité + pas de `X-Powered-By`. **Intègre l'API publique (Health)** : factory serveur par
  requête + client public navigateur (sans session, `enableRefresh:false`), **TanStack Query** (retry
  borné), **SSR + hydratation** (page `force-dynamic`, build indépendant de l'API). Expose les **flux BFF
  Auth** : `login`/`refresh`/`logout`/`csrf` via **Route Handlers** `/api/auth/*` — cookies `HttpOnly`
  access/refresh (jamais renvoyés au navigateur, `__Host-` prod), **CSRF double-submit** (cookie non
  HttpOnly + `X-CSRF-Token`, temps constant, rotation), **Origin/Referer** (fail-closed), corps borné,
  erreurs génériques, `X-Request-Id` propagé, logout idempotent. **Lit aussi le profil/les autorisations** :
  `GET /api/auth/me` + `GET /api/auth/authorization` (Route Handlers **read-only**, `no-store`) → **client
  BFF navigateur** (same-origin, `credentials:"include"`, **aucun token lu/exposé**) → hooks **`useSession`**
  (`loading`/`authenticated`/**`anonymous` (401)**/**`error` (403/5xx/réseau)**) et **`useAuthorization`**
  (activé si authentifié ; helpers `hasRole`/`hasAnyRole`/`hasPermission`/`hasAllPermissions`, **OR/AND, sans
  wildcard**, ADR-006) ; **logout purge** `authKeys.all` (Health conservé). **Premier layout protégé**
  (Web Auth 4) : groupe `(protected)` + page `/protected` ; le **layout Server Component** résout la session
  **côté serveur read-only** (`resolveServerSession` → API `/auth/me`, `enableRefresh:false`, **aucun appel
  au BFF local**, **aucune écriture cookie** via `guardReadOnly`) → **redirige** l'anonyme (`/?auth=required`,
  temporaire), rend **« Service indisponible »** si l'API est down (≠ anonyme), sinon **hydrate** le profil
  (`prefillSessionQuery` → `useSession` authentifié au 1ᵉʳ rendu, **sans** second `/me`). **Page de connexion
  `/login`** (Web Auth 5) : formulaire accessible, **login BFF** (`performBffLogin` : CSRF → `POST /api/auth/login`,
  **aucun token lu**), `useLogin` (purge `authKeys`, **anti-double-soumission**, aucun credential en cache),
  navigation **`router.replace(returnTo)` + `refresh()`** ; **`returnTo` interne assaini** (`sanitizeReturnTo`,
  anti open-redirect) ; utilisateur déjà authentifié **redirigé** hors `/login`. La redirection anonyme du
  layout protégé pointe vers `/login?returnTo=/protected`. **Lit les fichiers en lecture seule** (Files 1) :
  deux **Route Handlers BFF ciblés** (jamais un proxy générique) `GET /api/files/:id` (métadonnées
  **publiques**, client serveur **read-only**, `no-store`) et `POST /api/files/:id/download-url` (URL signée
  courte, client serveur **writable** réutilisant le refresh BFF, **Origin/Referer + CSRF**, `no-store`) — seul
  l'**UUID** du chemin est accepté (UUID invalide → **400 sans appel API**) ; mapping d'erreurs **distinct**
  (400/401/403/**404 anti-énumération**/**409**/429/**503**) ; client BFF navigateur (`credentials:"include"`,
  **aucun Bearer**) ; `fileKeys` **disjoints** ; `useFileMetadata` (query, `enabled` si UUID, `retry:false`) +
  **`useCreateDownloadUrl`** (**mutation** : l'URL signée est **consommée immédiatement** puis abandonnée —
  **jamais** en cache/log/persistance) ; téléchargement via **ancre temporaire** (`rel="noopener noreferrer"`,
  URL `https`-only validée) ; page privée `/protected/files/[id]` avec états UI réutilisés ; **l'API reste
  l'autorité** (permission `files.read`/`files.download` + ownership), `useAuthorization` ne fait qu'afficher le
  bouton ; **aucun champ interne** (storageKey/bucket/checksum/ownerId). **Files 2 (upload)** : `POST /api/files/upload` BFF ciblé, `FormData` multipart, validation fichier+catégorie, `useUploadFile`, `UploadForm`, page `/protected/files/upload`, 413/415. **Files 3 (suppression)** : `DELETE /api/files/:id` BFF ciblé (`assertDelete`, UUID avant CSRF, client `writable`, 409→NOT_DELETABLE, anti-énumération), `deleteFile` client BFF, `useDeleteFile` (anti-double-soumission, `removeQueries` après succès), Dialog confirmation UI Kit 4, prop `onDeleteSuccess`, `FileDetailsWithNav`. **Files 4 (liste)** : `GET /api/files` BFF ciblé, validation limit/offset (400 avant appel API), client `read-only`, `FileListResponse`, `listFiles` client BFF, `fileKeys.list` clé stable, `useFileList` (retry:false), `FileListView` (loading/vide/erreur/liste, champs publics, pagination Précédent/Suivant), page `/protected/files`. **Files 6 (revue V1)** : 4 défauts corrigés (D1 cache delete→list, D2 cache upload→list, D3 message 409 neutre, D4 upload 409→QUOTA_EXCEEDED), 3 tests ajoutés, verdict **stable avec réserves mineures**, rapport `docs/project-status/WEB_FILES_V1_REVIEW.md`. **Files 7 (admin BFF)** : handlers BFF `handleQuarantineFile`/`handleRestoreFile` (`POST /api/files/:id/quarantine|restore`, assertPost→UUID→CSRF+Origin→client writable→409 catch explicite), routes `/api/files/[id]/quarantine|restore`, client BFF `quarantineFile`/`restoreFile` (same-origin, credentials:include, X-CSRF-Token, jamais Authorization), hooks `useQuarantineFile`/`useRestoreFile` (mutation sans mutationKey, anti-double-soumission useRef, `fileKeys.all` invalidation onSuccess), `AdminFileActions` (null si pas de permission admin, boutons conditionnels hasPermission("files.quarantine")/hasPermission("files.restore"), alertes succès/erreur), page `/protected/files/[id]/admin`. CSRF+Origin obligatoires sur toutes mutations. API reste l'autorité. +53 tests. **Files 8 (E2E upload/suppression)** : extension `e2e/files.spec.ts` — deux nouveaux `describe` : upload (`UploadForm` formulaire → `<section aria-label="Fichier envoyé">` → liste → détail) + suppression (fixture `uploadFileViaApi` isolée → Dialog → `router.replace("/protected")` → anti-énumération 404 → liste vide). `helpers.ts` : `uploadFileViaApi` + `TEST_PNG_B64` exportés. **14 tests E2E** (12 → 14, +2). Aucun BFF/runtime/package modifié. **V1 Gap 1 (public layout + landing page)** : route group `(public)/` — layout public Server Component (header "Enistère" + lien "Se connecter" + footer), landing page statique à `/` (metadata SEO `robots:index:true`, `openGraph`, h1 "Enistère OS Foundation", CTAs → `/login`/`/status`), page technique de statut déplacée à `/status`, `robots.ts`, `sitemap.ts`. **Critère §56 #11 fermé** (SEO baseline pages publiques). **V1 Gap 2 (dashboard layout)** : `DashboardShell` Server Component (`src/features/dashboard/dashboard-shell.tsx`) — header de navigation protégé (Accueil/Fichiers/Envoyer un fichier), liens `<a>` natifs (compatibilité `tsconfig.test.json`). Intégré dans `(protected)/layout.tsx` sur le chemin authentifié uniquement. **Critère §56 #3 fermé** (layouts standards : public ✓ + dashboard/protégé ✓). Test E2E ajouté nav dashboard — **15 tests E2E** (14 → 15). **V1 Gap 3 (RHF + Zod UploadForm)** : `upload-form-schema.ts` (schéma Zod v4 : `file` `z.instanceof(File)`, `category` `z.enum`, `subjectId` `z.string().max(128)`) ; `upload-form.tsx` migré vers `useForm({ resolver: zodResolver(uploadFormSchema) })` — erreurs `formState.errors`, `aria-describedby`, reset complet, anti-double-soumission conservé ; `test/upload-form.test.tsx` (4 tests : fichier requis / catégorie requise / subjectId trop long / succès) ; dépendances : `react-hook-form@^7.81.0`, `zod@^4.4.3`, `@hookform/resolvers@^5.4.0`. **Critère §56 #9 fermé.** **Readiness V1 : 13/14 → 14/14 — V1 pleinement stable.** **450 tests** (+4) + preuves **API réelles** Auth/session
  **+ protégé 26/26 + login 22/22 + Files (API + MinIO) 21/21** (PostgreSQL + MinIO jetables). Statut :
  **VALIDE_V1** (14/14 critères §56). Build/dev via **webpack**
  (`extensionAlias`). Note transport : le client serveur authentifié **bufferise le corps** (sinon le
  `fetch` patché de Next échouait sur les réponses non-2xx — `expected non-null body source`).
- **Packages** : `@enistere/api-contracts` et `@enistere/api-client-fetch` (0.1.0, privés) — validés
  **localement** (tests + live 16/16), **non publiés** ; `api-client-fetch` **instancié (public/Health +
  authentifié/BFF Auth login/refresh/logout/me/authorization)** dans le Web Core ; types Auth dérivés via
  `SchemaOf<>` (`UserProfileResponseDto`, `AuthorizationSummaryResponseDto`) — preuve API réelle.
- **Cloud Core** : **`IMPLEMENTATION_PARTIELLE`** — spec + README + `docs/` (CC1 cadrage) **+ CC2 CI runtime API**
  `api-runtime-ci.yml` **+ CC3 CI E2E navigateur** `web-e2e-ci.yml` + **CC5 registry GHCR** `registry-ci.yml` +
  Dockerfiles (multi-stage, non-root) **+ CC6 staging manuel** + **CC7 dry-run** + **CC8 image API corrigée**
  (`debian-openssl-3.0.x`, `api-smoke` gate CI) **+ CC9 exécution locale** (`sha-d1e6242`, health 200) **+
  CC10 STAGING RÉEL HTTPS VALIDÉ** (`CC10_STAGING_DEPLOYMENT_REPORT.md`, `docker-compose.cc10.yml`) :
  reverse proxy compatible Traefik + Let's Encrypt HTTP-01, images `sha-5bf4c0f`, serveur staging Enistere — **4 conteneurs `healthy`** ;
  `staging.enistere.com` **200 HTTPS** ; `s3-staging.enistere.com` **200 HTTPS** ; seed RBAC 12 permissions
  + rôles ; utilisateur test `administrator` non documenté ; **auth BFF 200** (CSRF → login → `/me` → `/authorization`) ;
  **upload PNG → MinIO VALIDATED 200** ; **URL pré-signée `https://s3-staging.enistere.com/...` → téléchargement
  200** (DNS/CDN → reverse proxy → MinIO). **Bout-en-bout validé. Aucun secret dans le dépôt.**
  **+ CC11 SOCLE OPÉRATIONNEL VÉRIFIÉ** (`CC11_STAGING_OPERATIONAL_REPORT.md`, `CC11_OPERATIONAL_RUNBOOK.md`) :
  health HTTPS ×3 + TLS Let's Encrypt `Verify return code: 0` ; backup PG `staging-pg-*.sql.gz` **4.7 Ko** + restore
  validé (tous comptages) ; backup MinIO 1 fichier 67 B + restore test objet PASSED + nettoyé ; rollback
  `sha-484f98d` healthy + roll-forward `sha-5bf4c0f` healthy ; rotation compte smoke staging
  argon2id non conservée. Scripts versionnés : `backup-postgres.sh`, `backup-minio.sh`, `rotate-smoke-account.sh`.
  **Aucun secret dans le dépôt.** **Restent** : environnements protégés, monitoring continu, rollback automatisé,
  scan/signature image, `api-smoke` requis.
- **Mobile Core VALIDE_V1** : `mobile-react-native` → **`VALIDE_V1`** (Mobile Core V1 final readiness decision 2026-07-13 ; §9.4 **8/8** satisfaits ; B1 ✅ RN36 ; B3 ✅ RN37 réserve formellement acceptée ; B2 iOS acceptée comme réserve environnementale, sans preuve iOS artificielle) — **RN35** (tokens alignés verbatim UI Kit) ; **Expo SDK 55** / Expo Router. RN 1
  (starter, PR #11) + **RN 2 auth/session** (**AuthEngine** agnostique abonné par `AuthProvider` via
  `useSyncExternalStore` ; états `loading`/`authenticated`/`unauthenticated`/`refreshing`/`expired` ;
  **SessionStore** SecureStore + validation, access token **en mémoire** ADR-015 ; refresh coalescé ; `401`→refresh→
  retry) + **RN 3 forms/validation/offline** (primitives **RHF + Zod**, erreurs accessibles ; validation **UX**
  ADR-003 §18 backend autoritatif ; **offline préparatoire** queue mémoire, **sans** persistance/rejeu/NetInfo/
  donnée sensible ADR-015 §19) + **RN 4 — client officiel INTÉGRÉ** : **`@enistere/api-client-fetch` +
  `@enistere/api-contracts` consommés** (ADR-016 ; liés **`file:`** + **`metro.config.js`**, **core autonome — root
  package.json NON touché**, choix validé) ; `MobileAuthSessionAdapter` (**injection Bearer** de l'access token en
  mémoire, le client ne stocke aucun token, §27) + `EnistereAuthApi` (POST `/auth/login`+`/auth/refresh` via
  `client.raw` typé → mapping pur) ; **AuthEngine préservé** (refresh coalescé + expiration + 401→retry,
  `enableRefresh:false`) ; pont 401 `authedRequest` (RN 4B) ; erreurs `ApiClientError` ; `PlaceholderAuthApi` en
  repli. **+ RN 5 — couche server-state** : TanStack Query **générique** (ADR-012) — `createQueryKeys` (clés stables
  typées), **`useAuthedQuery`/`useAuthedMutation`** (appels authentifiés **via `authedRequest`**), `toQueryError`
  (normalisation UI **sans donnée sensible**), `invalidateScope`/`purgeServerState` (purge au logout) ; **401 jamais
  retenté, mutations sans retry, pas de persistance, aucun endpoint métier**. **+ RN 6 — état local UI + purge
  logout** : **Zustand** `useUiStore` générique (primitives UI **non sensibles** : `themePreference` + `flags`
  booléens) **séparé** du server-state (anti-pattern spec §57), **in-memory sans persistance** ; **purge logout
  déterministe câblée** dans `AuthProvider` (`await cancelQueries`→`clear` dès `unauthenticated`/`expired`, AuthEngine
  inchangé). **+ RN 7 — primitives d'upload sécurisé multipart** (ADR-007) : descripteur RN `MobileFile {uri,name,type}`
  (**structurellement assignable** au `ReactNativeFileDescriptor` du package) + helpers **purs** (`isMobileFile`,
  `describeFileForLog` **sans `uri`**, `isAllowedFileType` pré-check UX) + **`useUploadMutation`** via `useAuthedMutation`
  → `apiClient.files.upload(file, category, {subjectId, retryOnAuthRefresh:false})` (**refresh 401 possédé par
  l'AuthEngine**, `FormData` reconstruit au retry) ; **mutation → aucune clé de cache**, **aucun fichier/URL signée/
  token/Authorization** en cache/log/store ; `toQueryError` étendu **413/415** ; **backend autoritaire**, aucun
  endpoint métier/écran. **+ RN 8 — logger/observabilité (avec redaction)** (ADR-040) : logger générique typé
  `createLogger` (`debug`/`info`/`warn`/`error`, **niveaux**, **sink pluggable**, **horloge injectée**, corrélation
  `child`/`withRequestId`) + **redaction centrale** (`redactValue`/`redactString` : tokens/`Authorization`/cookies/JWT/
  **URL signées**/**chemins device** `file://`-`content://`/**PII**) appliquée **avant** tout sink → un token ne fuit
  pas même via un sink custom ; `safeErrorFields(QueryError)` (corrélation `requestId`, sans payload) ; **correctif
  `describeFileForLog`** (plus de nom brut → `{type,extension}`) ; `Error` sans stack ; **aucune persistance/transport
  réseau/service externe/log de body**. **+ RN 9 — permissions natives génériques gouvernées** (07_SECURITY §6 /
  ADR-015) : modèle pur `PermissionKind`/`PermissionStatus` + `normalizePermissionStatus` (chaînes/objets Expo/
  booléens, **conservateur**) + helpers ; `PermissionAdapter` (seam Expo) + `createPermissionService` (live
  `getStatus`/`request`/`ensure`/`openSettings`, **logs sûrs** `{kind,status}` via logger RN 8, **`PermissionAdapterError`**
  contrôlé sans cause sensible) ; **adaptateur placeholder** (no native dep) ; hook `usePermission` (**no UI**) ;
  **statut jamais persisté** ; **API Core = autorité**. **+ RN 10 — notifications locales génériques** (07_SECURITY
  §13 / ADR-040) : `NotificationMessage` **borné/sûr** (`sanitizeNotificationMessage` ; `describeNotificationForLog`
  **sans contenu** — title/body/data jamais loggés) + modèle (delivery-state/`normalizeTrigger`) ; `NotificationAdapter`
  (seam Expo) + `createNotificationService` **réutilisant RN 9** (gate sur la permission `notifications` — **jamais de
  schedule sans permission usable**), `schedule`/`cancel`/`cancelAll`/`getDelivered`, **logs sûrs** `{id,status,state,
  count}`, **`NotificationError`** contrôlé ; **adaptateur placeholder** (no native dep, ids déterministes) ; **LOCAL
  only** (aucun push/token device/FCM/APNs, aucun stockage, aucune UI). **+ RN 11 — i18n / localisation primitives
  génériques** (08_STANDARDS / 06_DEPENDENCY) : modèle de locale (`normalizeLocale` via **`Intl.getCanonicalLocales`**,
  `getLocaleDirection` ltr/rtl, `resolveLocale`) + **catalogue typé** (`createTranslator` : `t`/`has`/`plural`,
  interpolation `{name}`, **pluralisation `Intl.PluralRules`**, clé inconnue **sans throw**) + **formatters `Intl`**
  (`formatDate`/`formatNumber`/`formatCurrency` — devise requise, **ne lèvent jamais**) ; `LocaleAdapter` + **placeholder**
  (no native dep, no persistence) + `createLocalization` ; **aucune dépendance** (Intl built-in), aucun réseau/persistance/
  UI, **catalogues métier = projets dérivés**. **+ RN 12 — deep-linking / routing primitives génériques** (07_SECURITY
  §7/§8) : parseur pur (`parseDeepLink`/`decodeSafe`/`normalizeUrl`, custom schemes + `https`, **sans `URL` global**) +
  **`resolveLink`** (`internal`/`externalBlocked`/`invalid`) — **allowlist stricte** schemes/hosts (**`http` →
  `insecure_scheme`**), **anti-open-redirect** (`//`/`scheme://`/`..`), **params sensibles supprimés**, **bornes** ;
  `isInternalRoute` ; **`resolveNotificationLink`** (clé configurable, tap notification RN 10) ; **aucun log** (ni query
  sensible), **aucun stockage** de lien/URL, **aucune dépendance** ; routes concrètes = projets dérivés. **+ RN 13 —
  analytics / télémétrie primitives génériques (avec redaction, sans SDK réel)** (07_SECURITY §13 / ADR-040) :
  `AnalyticsEvent` borné + **redaction dédiée BASÉE sur RN 8** (`isSensitiveProperty` **réutilise `isSensitiveKey`** +
  exact/substring ; `sanitizeAnalyticsEvent` **supprime les clés sensibles** + **scrube les valeurs via `redactString`**
  + **borne**, **sans throw**) ; `AnalyticsAdapter` (`track`/`flush?`, **PAS de `identify`**) + `createAnalyticsService`
  (track **best-effort non-intrusif**, **logs RN 8 sûrs** `{eventName,propertyCount}`, erreurs adapter **contrôlées**) ;
  **placeholder** mémoire (tests) ; **aucun SDK réel/réseau/persistance/user-id réel/token**. **+ RN 14 — accessibilité
  (a11y) primitives génériques** (ADR-010 §16 / spec §45) : props RN-compatibles (`buildA11yProps`/`normalizeA11yText`
  borné) + **`A11yState`** normalisé (quartet `disabled`/`focused`/`pressed`/`invalid` + RN `accessibilityState` ;
  `mergeA11yState`/`isInteractiveRole`) + **annonce** lecteur d'écran (`sanitizeAnnouncement` ; **`describeAnnouncementForLog`
  sans texte**) + `A11yAdapter` (announce/focus?/isScreenReaderEnabled?, **`A11yAdapterError`** contrôlé) + **placeholder**
  mémoire + `createA11yService` (best-effort **non-intrusif**, `isScreenReaderEnabled` **défaut `false`** en erreur, **logs
  RN 8 sûrs** `{length,assertive}`) ; **aucun `AccessibilityInfo` réel/provider global/stockage/UI/dépendance**. **+ RN 15
  — app lifecycle primitives génériques** (02/06 / ADR-040) : modèle **`AppLifecycleState`** (`active`/`background`/
  `inactive`/`unknown`) + helpers purs (`normalizeAppLifecycleState` tolérant — incl. `extension`→`background`,
  `isForeground`/`isBackground`, **`isValidTransition`** matrice, `nextAppLifecycleState`) ; `AppLifecycleAdapter` (seam
  RN `AppState`) + **`AppLifecycleAdapterError`** contrôlé + **placeholder** mémoire + `createAppLifecycleService`
  (`getState`/`subscribe`/`transition`/`dispose`, transitions **validées** ; **best-effort non-intrusif** — erreurs
  adapter contrôlées + **listener isolé** ; **logs RN 8 sûrs** `{from,to}`/`{operation}` enums seulement, **aucune donnée
  utilisateur**) ; **aucun `AppState` réel/provider global/stockage/dépendance**. **+ RN 16 — connectivité réseau
  (network status) primitives génériques** (ADR-015 §19 / 06) : **étend `src/offline`** (RN 3 inchangé,
  **`shouldQueueMutations` canonique**) — `NetworkConnectionType` **borné** (jamais SSID/carrier/IP) +
  `normalizeNetworkStatus`/`normalizeConnectionType` tolérants ; `NetworkAdapter` (seam RN NetInfo) +
  **`NetworkAdapterError`** + **placeholder** mémoire + `createNetworkService` (`getStatus(): NetworkState`/`shouldQueue`/
  `subscribe`/`transition`/`dispose`, `changedAt` via **horloge injectée**, **best-effort non-intrusif** — erreurs adapter
  contrôlées + **listener isolé**, **logs sûrs** `{from,to,type}` enums) ; **aucun NetInfo réel/dépendance/offline sync/
  persistance/donnée sensible**. **+ RN 17 — feature flags / config primitives génériques** (ADR-015 §19/§21 / 06) :
  **étend `src/config`** (env inchangé, **distinct des `flags` UI Zustand RN 6**) — `FlagValue` (boolean/string/number) +
  `FlagSet` **bornés** (`MAX_FLAG_KEY_LENGTH`/`MAX_FLAG_VALUE_LENGTH`/`MAX_FLAGS`) + `isValidFlagKey`/`normalizeFlagValue`/
  **`sanitizeFlagSet`** tolérants + **getters typés à défaut sûr** (`getBooleanFlag`/`getStringFlag`/`getNumberFlag`/
  `getFlagValue<T>` — valeur rendue **seulement si le type correspond**) + **`describeFlagsForLog`** → **`{count}`
  seulement** ; `FlagAdapter` (seam local/remote-config) + **`FlagAdapterError`** + **placeholder** mémoire +
  `createFlagService` (`getFlag`/`getAll`/`subscribe`/`refresh`/`dispose`, **best-effort non-intrusif** — erreurs adapter
  contrôlées + **listener isolé**, **logs sûrs** `{count}`/`{operation}` — **jamais clé ni valeur**) ; **aucun SDK
  remote-config réel/réseau/persistance/user targeting réel/secret/donnée sensible**. **+ RN 18 — gate biométrique local
  primitives génériques** (ADR-015 §20/§21) : **ajoute `src/biometrics`** — `BiometricAvailability` (`available`/
  `notEnrolled`/`unsupported`/`unknown`) + `BiometricType` **borné** (`fingerprint`/`facial`/`iris`/`unknown`) +
  `BiometricAuthOutcome` (`success`/`refused`/`cancelled`/`lockout`/`unavailable`/`error`) ; helpers **tolérants**
  (**junk → `unknown`/`error`, jamais `success`**) + objets **gelés** ; `BiometricAdapter` (seam Expo
  `LocalAuthentication`/Keychain, **async** ; `reason` du prompt **jamais loggé**) + **`BiometricAdapterError`** +
  **placeholder** mémoire (`setAvailability`/`setNextOutcome` + compteur `authenticateCalls`) + `createBiometricService`
  (`getAvailability`/`isAvailable`/`authenticate`, **stateless**, **aucun faux succès** — `unavailable` **sans prompt** si
  inutilisable, adapter qui throw → `error`, **ne throw jamais**, **logs sûrs** `{availability,type}`/`{outcome}`/
  `{operation}` — **jamais prompt ni cause native**) ; **gate d'UX local — ne remplace JAMAIS l'auth serveur (API Core =
  autorité)** ; **aucun `LocalAuthentication`/Keychain réel/secret/biométrie/résultat/profil stocké**. **+ RN 19 — crash /
  error-reporting primitives génériques (seam, sans SDK réel)** (ADR-040 §17/§18/§19 / ADR-015 §12/§21/§24) : **ajoute
  `src/crash-reporting`** — `CrashReportEvent` borné (`severity`/`source`/`name`/`message`/`stack?`/`context`) **rédigé via
  la redaction centrale RN 8** + bornes (`sanitizeCrashMessage`/**`sanitizeCrashStack`** — chemins device/tokens/URL
  signées/emails scrubés + cap frames, **jamais de stack brute** ; `sanitizeCrashContext` — clés sensibles → `[Redacted]`,
  primitives bornées) + `normalizeCrashSeverity`/`normalizeCrashSource` tolérants + `createCrashReportEvent` (**gelé**) +
  `describeCrashEventForLog` → **`{severity,source}` seul** ; `CrashReporterAdapter` (seam Sentry/Crashlytics ; ne reçoit
  QUE des événements **assainis**) + **`CrashReporterAdapterError`** + **placeholder** mémoire (copies défensives) +
  `createCrashReporterService` (`captureError`/`captureMessage`/`setContext`/`flush`, **best-effort non-intrusif** — sync
  throw + async reject **capturés**, **jamais de faux succès / re-throw / rejection non gérée**, **logs sûrs**
  `{operation,severity,source}` — **jamais le contenu**) ; **primitive préparatoire — ne décide PAS ADR-019** ; **sans SDK
  réel/réseau/persistance/batching/crash handler global ; aucun token/cookie/URL signée/URI device/PII/body/stack brute/
  user-id réel**. **+ RN 20 — préférences non sensibles persistantes primitives génériques (seam, sans MMKV/AsyncStorage
  réel)** (ADR-015 §15/§16) : **ajoute `src/preferences`** — couche **persistée NON SENSIBLE**, **distincte** de
  SecureStore (secrets), du store Zustand RN 6 (UI in-memory) et de TanStack Query (server-state) ; `PreferenceValue`
  (bool/string/number) + `PreferenceSet` bornés + **`isValidPreferenceKey`** (format **+ non sensible**, réutilise
  `isSensitiveKey`) + **`isSensitivePreferenceValue`** (string que la redaction RN 8 modifierait) + `sanitizePreferenceSet`
  + getters typés à défaut sûr + `describePreferencesForLog` → **`{count}` seul** ; `PreferenceStore` (seam **async**
  MMKV/AsyncStorage) + **`PreferenceStoreError`** + **placeholder** mémoire (copies défensives) + `createPreferenceService`
  (`get`/`getBoolean`/`getString`/`getNumber`/`set`/`remove`/`clear`/`getAll`/`subscribe` — **garde les écritures**
  (clé/valeur sensible → **drop**) + **assainit les lectures**, **best-effort non-intrusif** sans throw, **listener
  isolé**, **logs sûrs** `{operation,count}` — **jamais clé ni valeur**) ; **aucun MMKV/AsyncStorage réel/réseau/secret/
  PII ; ne décide aucun stockage natif**. **+ RN 21 — consentement télémétrie / privacy gate primitives génériques**
  (ADR-038) : **ajoute `src/consent`** — **primitive préparatoire** qui **ne décide PAS ADR-038** et **ne câble pas**
  analytics (RN 13)/crash (RN 19) ; `ConsentCategory` (`analytics`/`crash`/`performance`/`diagnostics`) + `ConsentStatus`
  (`granted`/`denied`/`unknown`) + `ConsentSet` ; `normalizeConsentCategory` (inconnue → ignorée) + `normalizeConsentStatus`
  (junk → `unknown`, **jamais `granted`**) + **`sanitizeConsentSet`** + `isConsentGranted` + **`isTelemetryAllowed`** =
  **default-deny** (true **seulement** si catégorie connue ET `granted`) + `describe*ForLog` ; `ConsentStore` (seam async)
  + **`ConsentStoreError`** + **`createPreferenceConsentStore`** (persistance **déléguée aux préférences RN 20**, clés non
  sensibles `privacy.consent.*`, **`clear()` ne touche que ces clés**) + **placeholder** mémoire (copies défensives) +
  `createConsentService` (`get`/`set`/`isAllowed`/`getAll`/`clear`/`subscribe` ; **best-effort non-intrusif** — store qui
  throw → `unknown` (**non autorisé**) sans throw, catégorie inconnue ignorée, **listener isolé** ; **logs sûrs**
  `{operation,category,status}`/`{operation,count}` — **jamais de valeur utilisateur**) ; **aucun SDK réel/réseau/UI/
  identifiant/PII**. **+ RN 22 — environnement / métadonnées app primitives génériques non identifiantes (seam, sans
  `expo-application`/`expo-device` réel)** : **ajoute `src/app-environment`** — contexte **coarse et NON identifiant** pour
  télémétries (analytics RN 13/crash RN 19) **gaté par le consentement RN 21** ; RN 22 **ne câble pas** analytics/crash ;
  `AppEnvironmentSnapshot` **borné, allow-list stricte** (`os` ios/android/web/unknown + `osVersionMajor` **majeur** +
  `appVersion`/`buildNumber`/`buildChannel`/`locale`/`environment`) + normalizers tolérants (**`normalizeMajorVersion`**
  `17.5.1`→`17`, `normalizeLocaleField` via i18n) + **`sanitizeAppEnvironmentSnapshot`** (lit **uniquement** les clés
  autorisées → **drop** deviceId/IDFA/AndroidID/installationId/pushToken/serial/model/IP ; gelé) + `describeAppEnvironmentForLog`
  (grossier) ; `AppEnvironmentAdapter` (seam synchrone) + **`AppEnvironmentAdapterError`** + **placeholder** mémoire (copies
  défensives, strippe les identifiants seedés) + `createAppEnvironmentService` (`getSnapshot`/`describeForContext`,
  **best-effort** → `{os:unknown}` sans throw, **ne persiste rien**, **ne collecte rien auto**, **logs sûrs** `{operation}`+
  grossiers) ; **aucun `expo-device`/`expo-application` réel/identifiant device/PII/collecte auto ; ne décide ni
  ADR-038/ADR-019/ADR-018**. **+ RN 23 — presse-papiers (clipboard) sécurisé primitives génériques (seam, sans
  `expo-clipboard` réel)** (ADR-040 §17/§18 / ADR-015 §21/§24) : **ajoute `src/clipboard`** — canal **transitoire/partagé/
  non fiable** dont le **contenu n'est JAMAIS loggé** (métadonnées seules) ni persisté ; `ClipboardSensitivity` (`normal`/
  `sensitive`) + `ClipboardOperationResult` (`success`/`unavailable`/`rejected`/`error`) + `normalizeClipboardText` (borné)
  + **`isSensitiveClipboardText`** (redaction RN 8 : Bearer/JWT/email/URL signée/URI device → sensible) +
  `describeClipboardTextForLog` (**`{length,sensitivity}` seul**) ; `ClipboardAdapter` (seam `expo-clipboard`) +
  **`ClipboardAdapterError`** + **placeholder** mémoire (slot transitoire) + `createClipboardService` (`copy`/`getString`/
  `hasString`/`clear` — **`copy` refuse un texte sensible sans `allowSensitive` → `rejected` adapter NON appelé** ;
  **`getString` opt-in explicite** jamais auto, valeur sensible **jamais loggée** ; **`clear` no-op sûr** ; **best-effort**
  — adapter throw → `error` sans throw ; **logs sûrs** `{operation,result,sensitivity,length}` — **jamais le contenu**) ;
  **clipboard NON stocké (pas de preferences/Zustand/Query/SecureStore) ; aucun `expo-clipboard` réel/réseau/persistance/
  UI/lecture auto**. **+ RN 24 — retry / backoff primitives génériques** : `src/retry` — `RetryPolicy` borné
  (`maxAttempts` inclut l'appel initial), `computeBackoffDelay(attempt, policy, rng?)` exponentiel borné + jitter
  déterministe via `rng`, `isRetryableError`/`getRetryDecision` structurels, `withRetry(fn, policy, {sleep, rng,
  shouldRetry?, logger?})` à `sleep` injecté ; **401/403/session-expired hard-blockés même via `shouldRetry`** ;
  erreur finale originale propagée ; logs `{attempt,delayMs}` seuls ; **aucun branchement automatique** sur AuthEngine,
  `withAuthRetry`/`authedRequest`, QueryClient ou mutations. Layout **plat** + **autonome**. **346 tests `node --test`**
  (… + clipboard-model + clipboard-service + **retry-policy-backoff + retry-retryable-error + retry-with-retry**).
  Vérifs : **typecheck + lint + test 346/346 + expo-doctor 19/19 + git diff --check verts** (**RN 24 n'ajoute aucune
  dépendance**) ; packages liés `api-contracts`
  11/11 + `api-client-fetch` 29/29. **Aucune logique métier.** Différés : **écran/picker d'upload**, **push distant réel +
  token device**, **adaptateurs natifs réels** (permissions/notifications/localisation/linking/AccessibilityInfo/AppState/
  NetInfo/LocalAuthentication/Keychain/MMKV/AsyncStorage/expo-application/expo-device/**expo-clipboard**), **catalogues
  métier i18n + routes concrètes**, **SDK analytics réel** (sous ADR), **application des props a11y / câblage des effets
  lifecycle dans des composants**, **source remote-config/local réelle des feature flags**, **activation biométrique réelle
  + fallback concret** (par projet, documenté — ADR-015 §20/§31), **SDK crash réel (Sentry/Crashlytics) + crash handlers
  globaux** (ADR-019), **store de préférences natif réel** (MMKV/AsyncStorage, ADR-015 §15/§16), **SDK télémétrie réel + UI
  de consentement + câblage du gate dans analytics/crash** (ADR-038), **câblage du contexte environnement dans les
  télémétries** (après gate consentement), **retry/backoff** (= RN 24), **offline sync réelle** (ADR-029), **backend
  d'observabilité** (ADR-018/036). *(Garde CI `npm ls zustand` au root inchangée — mobile autonome, hors scope.)*
- **IMPLEMENTATION_AVANCEE** : **Quality Core** (`cores/quality-core/`) — Quality Core V2 Readiness Review + Advanced Readiness Review + QC7 (2026-07-12) : `CORE_SPECIFICATION.md` + `README.md` + `QUALITY_GATES_MATRIX.md` + **`BRANCH_PROTECTION_RUNBOOK.md`** (ruleset `protect-main` actif + 10 checks documentés) + **`RELEASE_PROCESS_RUNBOOK.md`** (merge ≠ release ≠ promotion de statut ; 5 types de release ; procédure 8 étapes) + **`AI_PROMPT_GOVERNANCE.md`** + 3 checklists + templates GitHub PR/Issues + prompts catalogués + **`scripts/quality-gates.mjs`** (7 scopes, 36 tests). Processus utilisé pour publier `foundation-v1.0.0` ; Docs Core consomme le scope `quality-gates docs`. **Protection `main` active via GitHub Rulesets** : 8 checks requis (`api-contracts`, `api-client-fetch`, `ui-kit`, `web-nextjs`, `audit`, `api-runtime`, `web-e2e`, `api-smoke`) ; les 2 checks `images` restent recommandés phase 2. Aucun workflow modifié par Quality Core, aucune dépendance, aucun changement runtime.
- **`VALIDE_V1`** : `mobile-flutter` (Flutter V1 Final Readiness Decision, 2026-07-14 — rapport `MOBILE_FLUTTER_V1_FINAL_READINESS_DECISION.md` ; §29 9/11 pleinement satisfaits + 2/11 PARTIAL iOS R1 ; B1→B5 tous fermés ; 218/218 tests headless + smoke `emulator-5554` 7/7 ✅ ; R1 iOS Linux acceptée comme réserve environnementale non bloquante — identique à RN B2 ; aucun succès iOS artificiel). Flutter 1→11 : spec, starter, auth shell + guards, Dio client + intercepteurs, upload multipart, SecureStorage + restoreSession(), RefreshInterceptor 401 coalescent, UI states (LoadingState/EmptyState/ErrorState/SuccessState), formulaire sign-in email+password+validation. Réserves maintenues : R1 iOS Linux, R2 pas backend, R3 Freezed, R4 logger redaction, R5 PreferenceStore. Décision post-Flutter V1 : `V3_POST_FLUTTER_ROADMAP_DECISION.md`.
- **`STARTER_INITIALISE`** : `api-spring` (Spring Boot 2, 2026-07-15 — `pom.xml` Spring Boot 4.1.0 + JJWT 0.12.6 + Java 21 + Maven Wrapper 3.9.12 ; Spring Security 7.x STATELESS + `JwtAuthenticationFilter` + CORS ; `AuthController` `/api/v1/auth/{login,me,logout,refresh}` ; auth stub sans DB (credentials config, JWT réel, refresh 501) ; `ApiError` + `GlobalExceptionHandler` ; `./mvnw verify` **18/18 ✅ BUILD SUCCESS** ; secrets via env vars `JWT_SECRET`/`STUB_USERNAME`/`STUB_PASSWORD`). ADR-041 (2026-07-14) : Maven retenu. Prochain : **Spring Boot 3 — PostgreSQL + JPA + Flyway + RBAC** (User/Role/Permission, UserDetailsService, refresh token persisté).
- **Vides** : `ai-core`, `web-angular`.
- **CI** : **4 workflows GitHub Actions** (tous verts sur `main`) — niveau 1 `ci.yml` (non-régression monorepo :
  ordre `api-contracts → api-client-fetch → ui-kit → web-nextjs → audit`, `npm ci` Node 24, `npm audit`, gardes
  Axios/Zustand) ; niveau 2 `api-runtime-ci.yml` (runtime API + e2e) ; niveau 3 `web-e2e-ci.yml` (E2E
  navigateur Playwright) ; niveau 4 partiel `registry-ci.yml` (**build + push images GHCR**). **Protection
  `main` active via GitHub Rulesets** (`protect-main`, enforcement `active`, PR obligatoire, 8 checks requis). **Conteneurisation** : Dockerfiles API/Web (non-root) + **compose staging
  exemple** (CC6). **Absents** : **déploiement réel** (staging exécuté/production), environnements protégés,
  monitoring, scan/signature d'image, couverture publiée. **CC8** : un **5ᵉ workflow-job `api-smoke`** (dans
  `registry-ci.yml`) **exécute l'image API** et vérifie le moteur Prisma → **gate le push GHCR** (ferme l'angle
  mort « image jamais exécutée »). Image **Web** + image **API (corrigée, moteur 3.0.x)** bootent toutes deux.
- **Git** : `main` aligné sur `origin/main` après Governance 3 (`0038318`, PR #86). Protection `main`
  active via GitHub Rulesets. Flux PR actif. Commits historiques
  (via PR) incluent : `fix(api): make docker runtime prisma engine compatible (#7)` (`d1e6242` — CC8 image API corrigée + `api-smoke`),
  `docs(cloud): prepare staging dry run (#6)` (`5118283` — CC7 dry-run),
  `docs(cloud): finalize staging integration (#5)` (`7b07e5e` — CC6B finalisé),
  `Merge PR #4 … cloud-core-6-staging` (`b001ce8` — CC6 staging intégré),
  `Merge PR #3 … cloud-core-5b-confirm` (`ac4e805` — CC5B validé),
  `Merge PR #2 … cloud-core-5b-verify` (`bfd33dc`),
  `ci(cloud): add ghcr registry workflow (#1)` (`b41a953`),
  `docs(cloud): harden ci governance`,
  `ci(web): add browser e2e validation workflow`,
  `ci(api): add runtime validation workflow`,
  `docs(cloud): define v1 execution baseline`,
  `ci: add minimal monorepo validation`,
  `docs(web-nextjs): review web core v1 increment`,
  `feat(web-nextjs): add secure file read access`,
  `feat(web-ui): add standard interface states`,
  `docs(web-nextjs): review web auth v1`,
  `feat(web-nextjs): add secure login experience`,
  `feat(web-nextjs): add server-resolved protected layout`,
  `docs(web-nextjs): review web core governance`,
  `feat(web-nextjs): add session and authorization state`,
  `feat(web-nextjs): implement secure auth BFF flows`, `feat(web-nextjs): establish server auth foundations`,
  `feat(web-nextjs): integrate public API and query layer`, baseline.
- **Audit** : **0 vulnérabilité** (TanStack Query v5 ; override `postcss ^8.5.15`).

## 4. Cores techniquement implémentés

`cores/api-nestjs/` (avancé), `cores/ui-kit/` (**VALIDE_V1** — tokens + 19 primitives Web + états UI, React 19 ; §12.4 4/4 + §59 9/9 ; cohérence mobile/web prouvée RN35) et
`cores/web-nextjs/` (Next 16 + UI Kit + API publique + TanStack Query + BFF Auth + Files + RHF+Zod ; **VALIDE_V1** 14/14 critères §56).

## 5. Cores de gouvernance / documentaires

**`quality-core`** : **VALIDE_V1** (Quality Core V1 Readiness Review, 2026-07-13) — `CORE_SPECIFICATION.md` + `README.md` + `QUALITY_GATES_MATRIX.md` + `BRANCH_PROTECTION_RUNBOOK.md` + `RELEASE_PROCESS_RUNBOOK.md` + `AI_PROMPT_GOVERNANCE.md` + 3 checklists `docs/checklists/` + templates GitHub PR/Issues + prompts catalogués + `scripts/quality-gates.mjs` (Node 24, sans dépendance : `list` / `plan <scope>` / `run <scope>`, 7 scopes, arrêt premier échec) + `scripts/quality-gates.test.mjs` (36/36 tests node:test) + `scripts/release-helper.mjs` + `scripts/quality-report.mjs`. Processus utilisé pour publier `foundation-v1.0.0`. Protection `main` active via ruleset `protect-main`. Docs Core consomme le scope `quality-gates docs`. Aucun workflow modifié par Quality Core. Aucune dépendance.

**`cloud`** : spéc + README + `docs/` de **cadrage opérationnel** (Cloud Core 1) — **pas** de starter/infra réelle
au sens applicatif (`IMPLEMENTATION_PARTIELLE`/`PAUSE_CONTROLEE`). `ui-kit`, `web-nextjs` **et
`mobile-react-native`** ont leur spéc **et** un starter (`mobile-react-native` →
**`VALIDE_V1`** (§9.4 **8/8** après RN36/RN37 + final readiness decision), Expo SDK 55 (RN 1→25 primitives + Settings RN26 + shell durci RN27 + smoke Android RN28/RN29 + iOS RN30 bloqué Linux + RN31 en attente macOS + formulaire sign-in RN32 + thème RN33 + patches SDK RN34 + **tokens UI Kit alignés + LoadingView/EmptyView/ErrorView + 13 tests alignment RN35** + **écran upload diagnostics + smoke POST /files RN36** + **PreferenceStore native strategy decision RN37** ; expo-doctor **19/19** ; **367 tests** + bundle Metro + smoke Android `emulator-5554` **passed** ; B2 iOS acceptée comme réserve environnementale, sans preuve iOS artificielle ; auth/session + forms/validation + offline préparatoire + **client officiel `@enistere/api-client-fetch` intégré + server-state + état local Zustand + purge logout + primitives upload multipart + logger/redaction + permissions runtime + notifications locales + i18n/localisation + deep-linking/routing + analytics/télémétrie + accessibilité a11y + app lifecycle + connectivité réseau + feature flags/config + gate biométrique local + crash/error-reporting + préférences non sensibles + consentement télémétrie + métadonnées app non identifiantes + presse-papiers sécurisé + retry/backoff + telemetry coordinator + tokens UI Kit alignés**).

## 6. Packages

`@enistere/api-contracts` (types OpenAPI, runtime-indépendant) ; `@enistere/api-client-fetch`
(client Fetch typé + wrappers : auth, erreurs, timeout, refresh, multipart). Workspaces npm
(`packages/*`, `cores/ui-kit`, `cores/web-nextjs`). **Non publiés** ; UI Kit **consommé** + `api-client-fetch`
**instancié (public/Health + authentifié/BFF Auth)** par le Web Core. Usage authentifié **intégré** (preuve API réelle).

## 7. ADR clés

20 ADR **Validés** (001–016, 034, 039, 040, **041**). **ADR-041** — build system Spring Boot : Maven (2026-07-14) — `pom.xml`, Spring Boot Parent POM, `mvn verify`. Implémentés et revus : 002 (Prisma), **007** (Files : upload **API** ;
**consommé en lecture côté Web** — métadonnées publiques + URL signée + téléchargement direct, **sans** upload),
039 (Argon2id), 040 (logging API). Partiels : **040** (logging **mobile** : logger client générique RN 8 + **redaction centrale** — tokens/URL signées/chemins device/PII — sans transport/persistance), 001 (monorepo), 003, **013** (CI minimale), **004** (session : adapter serveur Web + **état de session
navigateur** `useSession`/`useAuthorization`, read-only sans refresh silencieux), **005** (cookies web +
**CSRF** : flux BFF login/refresh/logout opérationnels, cookies `HttpOnly`, CSRF double-submit,
Origin/Referer — Web ; reste : autres mutations futures), **006** (RBAC : appliqué **côté API** ;
**consommé en lecture** côté Web via helpers OR/AND sans wildcard pour l'affichage conditionnel —
**l'API reste l'autorité**), **011** (Fetch instancié public + **authentifié** Web + client BFF navigateur + **façade Files** read-only),
**012** (TanStack Query intégré Web : server state Health, Auth **et Files** — cache disjoint, purge au logout,
**URL signée hors cache** via mutation), **013** (**CI minimale** GitHub Actions — non-régression monorepo ;
**partiel**), 016
(types Auth via `SchemaOf<>`). **013 partiel** (CI minimale). **ADR-034 implémenté** côté Mobile Flutter V1 (Material 3 contrôlé par tokens Enistere, `VALIDE_V1`). Décidés non implémentés : 014, 015. **008/009/010 partiels** (UI Kit).
ADR-017→033 et ADR-035→038 = backlog non rédigé. **ADR-013 (CI/CD)** : **PARTIELLEMENT_IMPLEMENTE** — **niveaux 1–3** :
`ci.yml` (non-régression monorepo) + `api-runtime-ci.yml` (runtime API) + `web-e2e-ci.yml` (E2E navigateur) ;
protection `main` active via ruleset `protect-main` (8 checks requis) ; restent couverture, release, déploiement,
environnements. **ADR-014 (registry)** : **`PARTIELLEMENT_IMPLEMENTE`** (CC5 — build + push GHCR sur `main`,
Dockerfiles ; sans déploiement). Détail : [`DECISIONS_REGISTER.md`](./DECISIONS_REGISTER.md).

## 8. Dernière étape terminée

**Quality Core 5 — release process runbook** (`cores/quality-core/RELEASE_PROCESS_RUNBOOK.md`) (2026-07-11) :
processus de release gouverné. **5 définitions** : merge (technique), promotion de statut (gouvernance documentaire), release Foundation (gouvernance globale), staging validation (déploiement technique), production (hors périmètre V1). **Règle fondamentale** : une release Foundation ≠ un simple merge. **5 types** : `foundation-v1-baseline` (critères + gates L1–L4), `core-v1-validation` (par core), `quality-v2-increment` (docs-only gates), `staging-candidate` (rapport CC11 requis), `hotfix` (CI complète, pas de raccourci). **Prérequis généraux** : état `main`, CI L1–L4, qualité locale, documentation, sécurité, Cloud. **Procédure 8 étapes** : type/scope → commits → project-status → gates → exclusions → notes → PR → tag post-merge. **Format notes de release** : résumé / cores / changements / sécurité / migrations / gates exécutés / limites / prochaine action. **Convention tagging futur** : `foundation-vX.Y.Z`, `core-web-vX.Y.Z`, `core-ui-kit-vX.Y.Z`, `quality-v2.N`, `staging-YYYYMMDD-sha`, `hotfix-vX.Y.Z-NNN` — convention proposée, non appliquée. `RELEASE_READINESS_CHECKLIST.md` Partie 5 ajoutée. Aucun tag créé. Aucune release créée. Aucun workflow modifié. Vérifications : `git diff --check` ✓, `npm audit` 0 vuln ✓, tests 36/36 ✓.

**Étape précédente — Quality Core 4 — alignement templates PR / Issues avec Quality Core** (`.github/`) (2026-07-11) :
modernisation des templates GitHub (PR : Quality Gates / hors périmètre / sécurité / gouvernance ; bug / feature / security : core, roadmap, impact, canal privé). `config.yml` Security Advisories. Vérifications : `git diff --check` ✓, `npm audit` 0 vuln ✓, tests 36/36 ✓.

**Étape précédente — Quality Core 3 — runbook de protection de branche et checks requis** (`cores/quality-core/BRANCH_PROTECTION_RUNBOOK.md`) (2026-07-11) :
procédure complète d'activation manuelle de la protection de branche `main`. **10 checks documentés avec noms exacts** : L1 (`api-contracts`, `api-client-fetch`, `ui-kit`, `web-nextjs`, `audit`), L2 (`api-runtime`), L3 (`web-e2e`), L4 (`api-smoke`, `images (api-nestjs, ./cores/api-nestjs, ./cores/api-nestjs/Dockerfile)`, `images (web-nextjs, ., ./cores/web-nextjs/Dockerfile)`). Statut courant après Governance 3 : **activé via GitHub Rulesets** (`protect-main`) avec 8 checks requis ; les deux checks `images` restent recommandés phase 2. Vérifications QC3 : `git diff --check` ✓, `npm audit` 0 vuln ✓, tests 36/36 ✓.

**Étape précédente — Quality Core 2 — script local de sélection des gates qualité** (`cores/quality-core/scripts/`) (2026-07-11) :
`scripts/quality-gates.mjs` (Node 24, sans dépendance) — `list` / `plan <scope>` / `run <scope>`. 7 scopes : `docs`, `packages`, `ui-kit`, `web`, `root-audit`, `mobile-static`, `all-safe`. Arrêt au premier échec, code de sortie propagé. Gates exclus par design : Cloud/staging, smoke Android/iOS, E2E Playwright, api-nestjs e2e. `scripts/quality-gates.test.mjs` : **36/36 tests node:test** (plans vérifiés sans exécution). Vérifications : `list` ✓, `plan all-safe` ✓, `plan mobile-static` ✓, tests 36/36 ✓, `git diff --check` ✓, `npm audit` 0 vuln ✓.

**Étape précédente — Quality Core 1 — cadrage opérationnel des gates qualité V2** (`cores/quality-core/`, `docs/checklists/`) (2026-07-11) :
démarrage du Quality Core comme core de gouvernance qualité. Statut : **`SPECIFICATION_DOCUMENTAIRE`**. Fichiers créés : `CORE_SPECIFICATION.md` (objectif, périmètre V2, 4 niveaux qualité, règle tests Cloud, gouvernance promotion statut), `README.md` (commandes existantes par core, guide PR, responsabilités), `QUALITY_GATES_MATRIX.md` (8 cores × 11 types de gate : typecheck/lint/test/build/audit/e2e/smoke/images/doctor/tokens/openapi). Checklists : `PR_QUALITY_CHECKLIST.md`, `RELEASE_READINESS_CHECKLIST.md`, `CORE_STATUS_REVIEW_CHECKLIST.md`. Aucun workflow GitHub modifié. Aucune dépendance. Aucun changement runtime. Vérifications : `git diff --check` ✓, `npm audit` root 0 vuln ✓.

**Étape précédente — UI Kit VALIDE_V1 review** (`docs/project-status/`) (2026-07-11) :
promotion officielle du UI Kit de `IMPLEMENTATION_AVANCEE` à `VALIDE_V1`. §12.4 **4/4** (tokens ✅ + 19 primitives Web ✅ + docs ✅ + cohérence visuelle mobile/web ✅ RN35) ; §59 **9/9** ; consommation prouvée Web Core VALIDE_V1 + Mobile Core STARTER_UI_KIT_ALIGNED. Réserves non bloquantes documentées (Storybook différé, composants avancés V2/VF, composants RN dans Mobile Core ADR-010). Vérifications : `typecheck` ✓, `lint` ✓, `test 181/181` ✓, `build` ✓, `tokens:check` ✓, `audit` 0 vuln ✓, `git diff --check` ✓.

**Étape précédente — Mobile RN35 — Alignement UI Kit / états UI mobile** (`cores/mobile-react-native/`) (2026-07-11) :
ferme le gap bloquant UI Kit V1 Readiness Review. `src/theme/tokens.ts` : couleurs hex, typographie et
radius alignés **verbatim** sur `cores/ui-kit/generated/typescript/tokens.ts` (tokensVersion 0.1.0) —
mapping `background.default/muted/elevated`, `foreground.default/muted/inverse`, `border.default`,
`action.primary`, `status.danger/success` pour light+dark. `src/states/index.ts` : aliases
`LoadingView`/`EmptyView`/`ErrorView`. `test/theme-token-alignment.test.ts` : **13 tests** (spacing,
radius, typography, a11y, couleurs light/dark, resolveTheme). `tsconfig.test.json` : inclut
`src/theme/tokens.ts`. `ARCHITECTURE.md` §40 : documentation complète de l'alignement.
Scores UI Kit après RN35 : **§12.4 4/4** + **§59 9/9**. Mobile Core statut : **`STARTER_UI_KIT_ALIGNED`**.
Vérifications : `typecheck` ✓, `lint` ✓, `test 367/367` ✓, `expo-doctor 19/19` ✓, `expo export -p ios` ✓, `npm audit` 0 vuln ✓, `git diff --check` ✓.

**Étape précédente — UI Kit V1 Readiness Review** (`docs/project-status/UI_KIT_V1_READINESS_REVIEW.md`) :
revue officielle du UI Kit après UI Kit 6 et Web Core UI 2. Score initial : **3/4 critères §12.4 + 8/9 critères §59.**
Décision : **`IMPLEMENTATION_PARTIELLE` → `IMPLEMENTATION_AVANCEE`**. Gap bloquant fermé par RN35 ; scores finaux **4/4 + 9/9**.

**Étape précédente — Web Core UI 2** (`cores/web-nextjs/src/shared/components/`) :
`LoadingState`, `EmptyState`, `ErrorState` réécrits comme wrappers minces vers UI Kit 6.
**0 régression** (450/450). `typecheck`/`lint`/`test 450/450`/`build`/`audit`/`diff --check` verts.

**Étape précédente — UI Kit 6 — State primitives** (`cores/ui-kit/`) :
4 nouvelles primitives (`LoadingState`, `EmptyState`, `ErrorState`, `SuccessState`). **15 → 19 primitives**. **146 → 181 tests**.

**Étape précédente — Cloud Core CC11 — Durcissement opérationnel staging** (`cores/cloud/`) :
socle opérationnel du staging CC10 vérifié sur 5 axes (health HTTPS ×3, backup PG + restore, backup MinIO + restore, rollback + roll-forward, rotation smoke). Scripts + runbook + rapport versionnés. Aucun secret dans le dépôt.

**Étape précédente — Cloud Core CC10 — Staging réel HTTPS** (`cores/cloud/`) :
`docker-compose.cc10.yml`, reverse proxy compatible Traefik + Let's Encrypt HTTP-01, `sha-5bf4c0f`, serveur staging Enistere. CI PR #73 verte.

**Étape précédente — Web Core Files 7 — Admin BFF quarantaine/restauration** (`cores/web-nextjs/`) :
ajoute les BFF handlers et primitives UI minimales pour consommer les capacités admin Files déjà présentes côté
API, sans nouveau comportement API et sans proxy générique. Livrables : `handleQuarantineFile` /
`handleRestoreFile` (ordre `assertPost` → UUID → CSRF+Origin → client `writable` → 409 explicite
`NOT_QUARANTINABLE` / `NOT_RESTORABLE`), routes `/api/files/[id]/quarantine` et `/restore`, client BFF
navigateur `quarantineFile` / `restoreFile` (same-origin, `credentials:include`, CSRF, jamais Bearer),
hooks `useQuarantineFile` / `useRestoreFile` (mutation sans `mutationKey`, anti-double-soumission, invalidation
`fileKeys.all`), `AdminFileActions` (rendu conditionnel par permissions `files.quarantine` / `files.restore`)
et page séparée `/protected/files/[id]/admin`. **+53 tests, Web 393 → 446**. CI PR #64 verte.

**Étape précédente — API Core Files 5 — liste propriétaire de fichiers paginée (read-only)** (`cores/api-nestjs/`, `packages/api-contracts/`, `packages/api-client-fetch/`) :
ajoute `GET /files?limit=&offset=` — liste paginée ownership-scoped des fichiers du propriétaire courant.
`files.read` requis, ownership-scoped, exclusion `DELETED` (`deletedAt: null`), tri `createdAt desc`,
pagination offset-based (`limit` 1–50, défaut 20 ; `offset ≥ 0`). Trick limit+1 (aucun COUNT séparé).
Réponse publique : `{ items: PublicStoredFile[], limit, offset, nextOffset: number | null }` — aucun champ
interne (`bucket`, `storageKey`, `checksum`, `ownerId`). **Nouveaux fichiers** : `file-list-query.dto.ts`
(`@Type(() => Number)` + `@IsInt` + `@Min`/`@Max` + `@ApiPropertyOptional({ type: 'integer' })`),
`file-list-response.dto.ts` (`items: PublicStoredFile[]`, décoration Swagger avec `PublicStoredFileDto`),
`test/files-list.e2e-spec.ts` (7 cas : liste vide, isolation ownership A≠B, exclusion DELETED, ordre
`createdAt desc`, pagination + nextOffset, champs internes absents, offset hors-borne). **Fichiers modifiés** :
`files.service.ts` (`listOwnedFiles()`, trick limit+1), `files.controller.ts` (`FilesService` ajouté,
`@Get()` avant `@Get(':id')`), `files.controller.spec.ts` (+6 cas), `files.service.spec.ts` (+3 cas).
OpenAPI régénéré (`files_list`, `FileListResponseDto`, `limit`/`offset`/`nextOffset` typés `integer`, `nextOffset` nullable). `api-contracts`
régénéré (`files_list`, `FileListResponseDto` dans `schema.ts`). `FilesApi.list({ limit?, offset? })`
ajouté dans `api-client-fetch`. **Vérifications** : `npm test` API **386/386**, `api-contracts`
**12/12**, `api-client-fetch` **30/30** + `npm run build` (api-contracts + api-client-fetch) +
`openapi:generate` + contracts `generate` verts.
Commit : `feat(api): add paginated owned file list endpoint (Files 5)`.

**Mobile Core React Native 30 — smoke runtime iOS / parity device** (`cores/mobile-react-native/`,
périmètre `scripts/**` + `package.json` + docs) : documente la parité runtime iOS du starter Expo
public/protégé/settings. `mobile-react-native` → **`STARTER_IOS_SMOKE_BLOCKED_BY_ENVIRONMENT`**. Script ajouté :
`npm run smoke:ios` (`scripts/smoke-ios.js`) — préflight macOS/`xcrun`/`simctl`/`npx`, rapport JSON structuré et
procédure macOS/device prête à exécuter. Résultat local : **bloqué** sur hôte Linux `greenovate` sans `xcrun`
(`detectedPlatform: linux`, `expectedPlatform: darwin`) ; aucun runtime iOS réel exécuté et aucune preuve
artificielle créée. Android reste couvert par RN28 (smoke visuel réel Android Emulator) et RN29
(`npm run smoke:android` `passed` sur `emulator-5554`). RN30 ne devient pas un E2E mobile complet ;
Detox/Maestro/Appium/Playwright mobile/XCTest custom restent différés sous décision de dépendance/ADR.
**Aucun réseau métier, endpoint métier, SDK/adaptateur natif réel, dépendance, persistance nouvelle, retry branché ni
modification AuthEngine/withAuthRetry/authedRequest/QueryClient/mutations**. Vérifs : **typecheck + lint + test 54
fichiers `node --test` + expo-doctor 19/19 + expo export iOS + smoke iOS blocked documenté + npm audit +
git diff --check verts**. Commit attendu : `docs(mobile): document ios smoke runtime blocker`.

**Mobile Core React Native 28 — smoke visuel device/simulateur du starter** (`cores/mobile-react-native/`,
périmètre runtime + docs) : vérifie le shell public/protégé/settings sur Android Emulator `Pixel_6a` via Expo Go
sans nouvelle primitive ni logique métier. `mobile-react-native` → **`STARTER_VISUAL_SMOKE_READY`**. Parcours
validé : sign-in public, login via mock auth local temporaire exposé par `adb reverse`, Home protégé, Settings
protégé, scroll Settings, retour Home, refresh session et sign out. Aucune correction UI/runtime requise ; les
captures locales ont été produites dans `/tmp` et le rapport gouverné est
`docs/project-status/MOBILE_RN28_VISUAL_SMOKE_REPORT.md`. iOS Simulator non exécuté sur l'hôte Linux (`xcrun`
absent). **Aucun réseau métier, endpoint métier, SDK/adaptateur natif réel, dépendance, persistance nouvelle,
retry branché ni modification AuthEngine/withAuthRetry/authedRequest/QueryClient/mutations**. Vérifs :
**typecheck + lint + test 54 fichiers `node --test` + expo-doctor 19/19 + expo export iOS + smoke Android réel +
git diff --check verts**. Commit attendu : `fix(mobile): verify starter visual smoke`. **Historique RN28** :
la prochaine action était RN29 ; elle est désormais réalisée.

**Mobile Core React Native 27 — durcissement runtime du starter Expo** (`cores/mobile-react-native/`,
périmètre `app/**` + `src/ui/**` + docs) : durcit le shell public/protégé/settings sans nouvelle primitive ni
logique métier. `mobile-react-native` → **`STARTER_RUNTIME_HARDENED`**. Corrections : `Button` borné/full-width
avec label réductible, conteneur Sign-in centré et contraint, conteneur Home contraint, lignes Settings multi-ligne.
Runtime : `expo export -p ios` réussit ; export web non applicable sans `react-native-web`, dépendance non ajoutée.

**Mobile Core React Native 26 — V1 usable starter shell / settings générique** (`cores/mobile-react-native/`,
périmètre `app/**` + `src/navigation/**` + docs) : ajoute une route Settings protégée pour rendre le starter
mobile plus exploitable sans logique métier, conformément à `strategy/04_ROADMAP_GLOBAL.md` §9 Mobile Core React
Native V1. `mobile-react-native` → **`STARTER_SETTINGS_READY`**. `ROUTES.settings = '/settings'`,
`app/(app)/settings.tsx` et un lien depuis Home complètent la navigation privée. L'écran expose : session
(statut, refresh, sign out), Preferences/UI (`themePreference` Zustand RN6 + reset UI), Privacy/Telemetry
(statuts RN21 via placeholder local, sans wiring global), Environment (contexte safe RN22 via placeholder/service,
sans identifiant) et Foundation diagnostics (auth, query, upload, logger, consent, telemetry coordinator, retry).
**Aucun réseau, endpoint métier, SDK réel analytics/crash, adaptateur natif réel, persistance nouvelle, retry branché
ni modification AuthEngine/withAuthRetry/authedRequest/QueryClient/mutations**. Aucun helper pur ajouté : rendu
runtime différé, validation par typecheck/lint + non-régression `node --test`. Vérifs : **typecheck + lint + test
+ expo-doctor 19/19 + git diff --check verts**. Commit attendu :
`feat(mobile): add generic settings starter shell`. **Historique : RN27 a depuis durci le runtime starter.**

**Mobile Core React Native 25 — telemetry context composition opt-in** (`cores/mobile-react-native/`, périmètre
`src/telemetry` + `test/telemetry-*` + docs) : ajoute une couche **opt-in** qui compose explicitement le
consentement RN 21, le contexte environnement safe RN 22 et les services analytics RN 13 / crash RN 19.
`mobile-react-native` → **`TELEMETRY_COORDINATOR_READY`**. `TelemetryContext` est borné par l'allow-list RN 22,
`getTelemetryConsentDecision`/`isTelemetryCategoryAllowed` restent default-deny, et
`createTelemetryCoordinator({ consent, environment, analytics?, crash?, logger? })` expose `track`,
`captureError`, `captureMessage`. Consentement `unknown`/`denied` ou service absent = no-op contrôlé ;
`granted` enrichit avec le contexte safe puis appelle explicitement le service concerné. Les erreurs adapter ne
cassent pas le flux. Logs sûrs `{operation,category,allowed}` uniquement. **Aucun SDK réel, réseau,
persistance, identify/user-id, émission automatique, branchement analytics/crash global ni usage du retry RN 24** ;
RN 25 ne décide pas ADR-038/ADR-019/ADR-018. **+9 cas `node --test`** (`telemetry-context-gate`,
`telemetry-service`) → **355 cas `test(...)`**. Vérifs : **typecheck + lint + test + expo-doctor 19/19 +
git diff --check verts**. Commit attendu : `feat(mobile): add telemetry coordinator primitives`.
**Historique : RN26 a finalement livré le Settings starter shell V1.**

**Mobile Core React Native 24 — retry / backoff primitives génériques** (`cores/mobile-react-native/`, périmètre
`src/retry` + `test/retry-*` + docs) : ajoute des primitives **pures et déterministes** sans réseau réel, sans dépendance
et sans `Date.now()` dans le chemin testé. `mobile-react-native` → **`RETRY_READY`**. **Aucun chemin existant modifié** :
AuthEngine, `withAuthRetry`/`authedRequest`, QueryClient et mutations restent inchangés. `RetryPolicy` est borné
(`maxAttempts` inclut l'appel initial), `computeBackoffDelay(attempt, policy, rng?)` est exponentiel borné avec jitter
déterministe via `rng`, `isRetryableError`/`getRetryDecision` classifient network/timeout/408/429/5xx comme retryables et
4xx/401/403/session-expired/inconnu comme non retryables, et `withRetry` utilise `sleep` injecté, hard-blocke
401/403/session-expired même via `shouldRetry`, propage l'erreur finale originale et logge seulement `{attempt,delayMs}`.
**+16 tests `node --test`** (`retry-policy-backoff`, `retry-retryable-error`, `retry-with-retry`) → **346 tests**.
Vérifs : **typecheck + lint + test 346/346 + expo-doctor 19/19 + git diff --check verts**. Commit attendu :
`feat(mobile): add retry backoff primitives`. **Historique : la prochaine action RN25 a depuis été réalisée.**

**Étape précédente — Mobile Core React Native 23 — presse-papiers (clipboard) sécurisé primitives génériques** :
`mobile-react-native` → **`CLIPBOARD_READY`**, `src/clipboard`, **330 tests**, aucun `expo-clipboard` réel, aucun log de
contenu, aucune persistance.

**Étape précédente — Mobile Core React Native 22 — environnement / métadonnées app primitives génériques non identifiantes (seam, sans
`expo-application`/`expo-device` réel)** (`cores/mobile-react-native/`, périmètre `src/app-environment` + `test/**` +
docs) : ajoute une **couche d'environnement / métadonnées app générique, NON IDENTIFIANTE**, **pure et testable**, **sans
`expo-device`/`expo-application` réel, sans réseau, sans collecte automatique**. `mobile-react-native` →
**`APP_ENVIRONMENT_READY`**. **Aucune dépendance ajoutée.** Elle fournit un **contexte technique sûr et grossier** destiné
à être attaché **plus tard** aux télémétries (analytics RN 13 / crash RN 19) **une fois gaté par le consentement RN 21** ;
RN 22 **ne câble pas** analytics/crash et **ne consulte pas RN 21 directement** (le futur adaptateur appliquera le gate).
**Modèle** (`model.ts`, agnostique) : `AppEnvironmentSnapshot` **borné, allow-list stricte** — `os`
(`ios`/`android`/`web`/`unknown`) + `osVersionMajor?` (**version MAJEURE seulement**) + `appVersion?`/`buildNumber?`/
`buildChannel?`/`locale?`/`environment?` (`local`/`development`/`staging`/`production`/`test`). Normalizers **tolérants** :
`normalizeOs` (alias → enum, sinon `unknown`), **`normalizeMajorVersion`** (`17.5.1` → `17`, borné), `normalizeAppVersion`/
`normalizeBuildNumber` (token allow-listé borné — texte libre/espaces droppés), `normalizeBuildChannel` (slug borné),
`normalizeRuntimeEnvironment` (allow-listé), **`normalizeLocaleField`** (réutilise **`normalizeLocale` i18n**, sans cycle).
**`sanitizeAppEnvironmentSnapshot`** ne lit **QUE** les clés autorisées → tout champ identifiant d'un input brut
(`deviceId`/`idfa`/`androidId`/`installationId`/`pushToken`/`serial`/`model`/`ip`…) est **droppé** ; objet **gelé**.
`describeAppEnvironmentForLog` → **champs grossiers seulement** (`os`/`osVersionMajor`/`buildChannel`/`environment` — **ni
version exacte ni locale**). **Adaptateur** (`adapter.ts`) : `AppEnvironmentAdapter` (seam **synchrone**
`expo-application`/`expo-device` : `getSnapshot()`) + **`AppEnvironmentAdapterError`** contrôlé (`operation` seul) ; un
adaptateur réel **ne doit lire aucun identifiant**. **Placeholder** (`placeholder-adapter.ts`) : mémoire ; `getSnapshot`/
`setSnapshot` **assainissent** (un seed avec identifiant est strippé) ; **copies défensives** (objet gelé) ; aucune
persistance. **Service** (`service.ts`, agnostique) : `createAppEnvironmentService({adapter, logger?})` → **`getSnapshot()`**
(assaini, gelé) + **`describeForContext()`** (record gelé des champs définis, prêt à attacher à une télémétrie).
**Best-effort non-intrusif** : un adapter qui throw → repli `{os:'unknown'}` + `warn`, **ne throw jamais** ; **ne persiste
rien** ; **ne collecte rien automatiquement**. **Logs RN 8 sûrs** : `{operation}` + champs grossiers — **jamais
d'identifiant/PII/version exacte**. **+11 tests `node --test`** (`app-environment-model` : normalisation OS/versions,
**`17.5.1` → `17`**, strings bornées, **champs identifiants droppés** d'un input brut, snapshot **gelé**, `describe*ForLog`
grossier ; `app-environment-service` : snapshot assaini gelé, **placeholder strippe les identifiants seedés**,
`describeForContext` champs autorisés seulement, **adapter défaillant → `{os:unknown}` sans throw**, **logs sans
identifiant/PII/version exacte**) → **320 tests** ; module **entièrement agnostique** (aucun hook/provider → rien en
typecheck-only). Vérifs : **typecheck + lint + test 320/320 + expo-doctor 19/19 + git diff --check verts** (**RN 22
n'ajoute aucune dépendance**). **Aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ;
aucun autre core. Commit `feat(mobile): add safe app environment primitives`.

**Étape précédente — Mobile Core React Native 21 — consentement télémétrie / privacy gate primitives génériques** (`cores/mobile-react-native/`,
périmètre `src/consent` + `test/**` + docs) : ajoute une **couche de consentement télémétrie / privacy gate générique**,
**pure et testable**, **sans SDK analytics/crash réel, sans réseau, sans UI de consentement, sans identifiant utilisateur
réel, sans PII**. `mobile-react-native` → **`CONSENT_GATE_READY`**. **Aucune dépendance ajoutée.** C'est une **primitive
préparatoire** : elle **ne décide PAS ADR-038**, **ne câble pas** les services analytics (RN 13)/crash (RN 19) et
**n'émet rien** ; son rôle unique = répondre « cette catégorie peut-elle émettre ? » selon une règle **default-deny**.
**Modèle** (`model.ts`, agnostique) : `ConsentCategory` (`analytics`/`crash`/`performance`/`diagnostics`) +
`ConsentStatus` (`granted`/`denied`/`unknown`) + `ConsentSet` (map partielle) ; `normalizeConsentCategory` (catégorie
inconnue → `undefined`, **ignorée**) ; `normalizeConsentStatus` (alias tolérés ; junk → `unknown`, **jamais `granted`**) ;
**`sanitizeConsentSet`** (catégories connues, drop `unknown` ; tolérant) ; `isConsentGranted` (true **seulement** si
`granted`) ; **`isTelemetryAllowed(set, category)`** = **default-deny** (true **seulement** si catégorie connue ET
`granted` ; `denied`/`unknown`/absent/invalide → `false`) ; `describeConsentEntryForLog` → `{category,status}` /
`describeConsentForLog` → `{count}` — **jamais de valeur utilisateur**. **Store** (`store.ts`, agnostique) : `ConsentStore`
seam (`get`/`set`/`getAll`/`clear`/`subscribe?`, **async**) + **`ConsentStoreError`** contrôlé (`operation` seul) ;
**`createPreferenceConsentStore(preferenceService)`** : la persistance est **déléguée aux préférences non sensibles RN 20**
sous clés **préfixées non sensibles** `privacy.consent.<category>` (un consentement = config, **pas un secret**) ;
**`clear()` ne supprime que les clés `privacy.consent.*`** (jamais tout le store de préférences). **Placeholder**
(`placeholder-store.ts`) : mémoire ; **copies défensives** ; notifie au changement ; aucune persistance. **Service**
(`service.ts`, agnostique) : `createConsentService({store, logger?})` → `get`/`set`/`isAllowed`/`getAll`/`clear`/
`subscribe`. **`isAllowed` = default-deny** (true **seulement** si `granted`). **Best-effort non-intrusif** : un store qui
throw → repli `unknown` (**= non autorisé**, défaut privacy sûr), **ne throw jamais** ; catégorie inconnue sur `set` →
**ignorée** ; **listener isolé**. **Logs RN 8 sûrs** : `{operation,category,status}` (enums) / `{operation,count}` —
**jamais de valeur utilisateur**. **+15 tests `node --test`** (`consent-model` : catégories/statuts, **junk → non
autorisé**, **granted seul autorise**, `denied`/`unknown` bloquent, `sanitizeConsentSet`, `describe*ForLog` enums/count ;
`consent-service` : get/set/isAllowed/getAll/clear, **catégorie inconnue ignorée**, **store défaillant → non autorisé sans
throw**, **listener isolé**, **logs enums/count** ; `consent-preference-store` : mapping `privacy.consent.*` **non
sensible**, round-trip, **`clear()` ne touche que le consentement**) → **309 tests** ; module **entièrement agnostique**
(aucun hook/provider → rien en typecheck-only). Vérifs : **typecheck + lint + test 309/309 + expo-doctor 19/19 + git diff
--check verts** (**RN 21 n'ajoute aucune dépendance**). **Aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/
`packages`/root modifié** ; aucun autre core. Commit `feat(mobile): add telemetry consent primitives`.

**Étape précédente — Mobile Core React Native 20 — préférences non sensibles persistantes primitives génériques (seam, sans MMKV/AsyncStorage
réel)** (`cores/mobile-react-native/`, périmètre `src/preferences` + `test/**` + docs) : ajoute une **couche de
préférences persistantes NON SENSIBLES générique**, **pure et testable**, avec un **seam futur MMKV/AsyncStorage** mais
**sans MMKV réel, sans AsyncStorage réel, sans SecureStore (secrets), sans Zustand persistant, sans réseau, sans logique
métier** (ADR-015 §15/§16). `mobile-react-native` → **`PREFERENCES_READY`**. **Aucune dépendance ajoutée.**
**Séparation des couches (ADR-015 / ADR-012)** : **SecureStore** = secrets ; **Préférences (RN 20)** = données **non
sensibles persistables** (thème/langue/onboarding/filtres non sensibles) ; **Zustand RN 6** = état UI **in-memory** non
persisté ; **TanStack Query RN 5** = server-state, **jamais** persisté ici. **Modèle** (`model.ts`, agnostique) :
`PreferenceValue` (`boolean`/`string`/`number`) + `PreferenceSet` ; bornes `MAX_PREFERENCE_KEY_LENGTH`/
`MAX_PREFERENCE_VALUE_LENGTH`/`MAX_PREFERENCES` ; **`isValidPreferenceKey`** (identifiant borné **ET non sensible** —
réutilise **`isSensitiveKey`** RN 8, une clé sensible n'est **jamais** une clé de préférence valide) ;
`normalizePreferenceValue` ; **`isSensitivePreferenceValue`** (une string que la redaction RN 8 **modifierait** —
Bearer/JWT/URL signée/URI device/email — est considérée sensible) ; **`sanitizePreferenceSet`** (drop clés/valeurs
invalides ou sensibles, cap ; tolérant — défense en profondeur sur ce qu'un store renvoie) ; **getters typés à défaut
sûr** (`getBooleanPreference`/`getStringPreference`/`getNumberPreference`/`getPreferenceValue<T>`) ;
`describePreferencesForLog` → **`{count}` SEULEMENT**. **Adaptateur** (`adapter.ts`) : `PreferenceStore` = seam **async**
MMKV/AsyncStorage (`get`/`set`/`remove`/`clear`/`getAll?`/`subscribe?`) — store **« bête »**, le **service** est le garde ;
**`PreferenceStoreError`** contrôlé (`operation` seul). **Placeholder** (`placeholder-store.ts`) : mémoire ; **copies
défensives** ; stocke les valeurs telles quelles (pour prouver que le service assainit en lecture) ; **aucune persistance
réelle**. **Service** (`service.ts`, agnostique) : `createPreferenceService({store, logger?})` → `get`/`getBoolean`/
`getString`/`getNumber`/`set`/`remove`/`clear`/`getAll`/`subscribe` (**async** sauf `subscribe`). **Garde les écritures**
(clé invalide/sensible **ou** valeur sensible → **drop**, jamais persister un secret masqué) et **assainit les lectures**
(`get`/`getAll` rejettent toute clé/valeur sensible présente dans le store). **Best-effort non-intrusif** : un store qui
throw → défaut sûr / no-op + `warn`, **ne throw jamais** ; **listener isolé**. **Logs RN 8 sûrs** : `{operation,count}` —
**jamais clé ni valeur**. **+15 tests `node --test`** (`preferences-model` : validation clés incl. **rejet des clés
sensibles**, normalisation/bornage, **`isSensitivePreferenceValue`**, `sanitizePreferenceSet` (drop clés/valeurs sensibles
+ cap), getters à défaut sûr, `describePreferencesForLog` **sans clé/valeur** ; `preferences-service` : round-trip get/set/
remove/clear, **refus des clés sensibles** token/accessToken/refresh_token/password/email/phone/signedUrl/apiKey, **refus
des valeurs sensibles** Bearer/JWT/email/URL signée/URI device, **lecture assainie** défense-en-profondeur, **store
défaillant best-effort sans throw**, **listener isolé**, **logs `{operation,count}` sans clé/valeur**, tolérance input
invalide) → **294 tests** ; module **entièrement agnostique** (aucun hook/provider → rien en typecheck-only). Vérifs :
**typecheck + lint + test 294/294 + expo-doctor 19/19 + git diff --check verts** (**RN 20 n'ajoute aucune dépendance**).
**Aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; aucun autre core. Commit
`feat(mobile): add non-sensitive preferences primitives`.

**Étape précédente — Mobile Core React Native 19 — crash / error-reporting primitives génériques (seam, sans SDK réel)**
(`cores/mobile-react-native/`, périmètre `src/crash-reporting` + `test/**` + docs) : ajoute une **couche de crash /
error-reporting générique**, **pure et testable**, **sans SDK réel** (Sentry/Crashlytics/Bugsnag/Firebase/OTel), **sans
réseau, sans persistance, sans batching, sans crash handler global obligatoire, sans logique métier**.
`mobile-react-native` → **`CRASH_REPORTING_READY`**. **Aucune dépendance ajoutée.** C'est une **primitive préparatoire**
qui **ne décide PAS ADR-019** (qui reste à rédiger). **Sécurité (ADR-040 §17/§18/§19, ADR-015 §12/§21/§24)** : toute
donnée passe par la **redaction centrale RN 8** (`redactValue`/`redactString`) puis est **bornée** ; **jamais** token/
cookie/Authorization/URL signée/URI device/PII/body, **jamais de stack brute**, **aucun user-id réel** (`identify`
absent), **aucun crash handler global** imposé. **Modèle** (`event.ts`, agnostique) : `CrashReportEvent` borné
(`severity`/`source`/`name`/`message`/`stack?`/`context`) ; `CrashSeverity` (`fatal`/`error`/`warning`/`info`) +
`CrashSource` (`unhandled`/`unhandledRejection`/`caught`/`manual`/`unknown`) + `CrashContext` (primitives seulement) ;
**`sanitizeCrashMessage`** (redaction + `MAX_MESSAGE_LENGTH`), **`sanitizeCrashStack`** (redaction chemins device/tokens/
URL signées/emails + cap `MAX_STACK_FRAMES`/`MAX_STACK_LENGTH` — **jamais de stack brute**), **`sanitizeCrashContext`**
(clés sensibles → `[Redacted]`, valeurs string rédigées+bornées, primitives gardées, non-primitifs droppés, cap
`MAX_CONTEXT_KEYS`) ; `normalizeCrashSeverity`/`normalizeCrashSource` **tolérants** (junk → `error`/`unknown`) ;
`createCrashReportEvent` (objet **gelé**, ne throw jamais) + `cloneCrashReportEvent` (copie défensive gelée) ;
`describeCrashEventForLog` → **`{severity,source}` UNIQUEMENT**. **Adaptateur** (`adapter.ts`) : `CrashReporterAdapter`
(seam Sentry/Crashlytics : `captureError`/`captureMessage`/`setContext?`/`flush?`) — ne reçoit **QUE** des
`CrashReportEvent` **déjà assainis** ; **`CrashReporterAdapterError`** contrôlé (`operation` seul). **Placeholder**
(`placeholder-adapter.ts`) : mémoire ; `getErrors`/`getMessages`/`getContext` renvoient des **copies défensives** (re-clone
gelé) ; `flushCount` ; no dep / réseau / persistance. **Service** (`engine.ts`, agnostique) :
`createCrashReporterService({adapter, logger?, context?})` → `captureError(error, opts?)` (défaut `error`/`caught`),
`captureMessage(message, opts?)` (défaut `info`/`manual`), `setContext` (merge + assainit l'ambient), `flush`
(best-effort, **ne rejette jamais**). **Best-effort non-intrusif** : un adapter qui **throw** (sync) **ou rejette**
(async) est **capturé** → `warn` sûr — **jamais re-throw, jamais de faux succès** (aucun `debug "reported"` si l'op a
échoué), **jamais de rejection non gérée**. **Logs RN 8 sûrs** : `{operation,severity,source}` (captures) /
`{operation}` (setContext/flush) — **jamais le message/stack/context**. **+17 tests `node --test`**
(`crash-reporting-event` : normalisation severity/source, **sanitization message/stack/context** — tokens/JWT/Bearer/
emails/URL signées/URI device rédigés, bornes, cap frames/keys, **tolérance input invalide**, objets **gelés**,
`describe*ForLog` enums ; `crash-reporting-engine` : capture error/message assainies → adapter, **setContext mergé/
assaini**, **capture ne throw jamais** (adapter sync qui throw), **adapter async qui rejette swallowed — pas de faux
succès**, **flush best-effort**, **logs `{operation,severity,source}` sans contenu sensible**, **placeholder copies
défensives**) → **279 tests** ; module **entièrement agnostique** (aucun hook/provider → rien en typecheck-only).
Vérifs : **typecheck + lint + test 279/279 + expo-doctor 19/19 + git diff --check verts** (**RN 19 n'ajoute aucune
dépendance**). **Aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; aucun autre
core. Commit `feat(mobile): add crash reporting primitives`.

**Étape précédente — Mobile Core React Native 18 — gate biométrique local primitives génériques** (`cores/mobile-react-native/`,
périmètre `src/biometrics` + `test/**` + docs) : ajoute une **couche de gate biométrique local générique**, **pure et
testable**, **sans Expo `LocalAuthentication` réel, sans Keychain, sans module natif, sans écran/provider/hook
obligatoire, sans logique métier**. `mobile-react-native` → **`BIOMETRIC_GATE_READY`**. **Aucune dépendance ajoutée.**
**Gouvernance (ADR-015 §20/§21)** : la biométrie est un **gate d'UX LOCAL uniquement** — un `success` signifie que le
*device* a validé localement, **ce n'est PAS une session serveur** et **ne remplace JAMAIS** login/refresh/session
(**l'API Core reste l'autorité**) ; elle **ne compense pas** une stratégie de token faible, **reste optionnelle** et
**laisse un fallback** au projet pour tout outcome non-`success` ; **rien de sensible n'est stocké ou loggé**. **Modèle**
(`src/biometrics/model.ts`, agnostique) : **`BiometricAvailability`** (`available`/`notEnrolled`/`unsupported`/
`unknown`) + **`BiometricType`** borné (`fingerprint`/`facial`/`iris`/`unknown` — jamais un descripteur natif
identifiant) + **`BiometricAuthOutcome`** (`success`/`refused`/`cancelled`/`lockout`/`unavailable`/`error`). Helpers
**tolérants** (`normalizeBiometric*` : alias/booléens → enum ; **junk → `unknown`/`error`, jamais `success`**) ;
`normalizeAvailabilityState`/`normalizeAuthResult` renvoient des objets **gelés** ; `isAvailabilityUsable` (`true`
**seulement** si `available`) ; `isAuthSuccess` (`true` **seulement** si `success`) ; `describeAvailabilityForLog` →
`{availability,type}`, `describeAuthResultForLog` → `{outcome}` — **enums uniquement**. **Adaptateur** (`adapter.ts`) :
**`BiometricAdapter`** (seam Expo `LocalAuthentication`/Keychain : `getAvailability`/`authenticate`, **async** comme les
API natives) ; `BiometricAuthRequest { reason? }` = **prompt forwardé tel quel, jamais loggé** ;
**`BiometricAdapterError`** contrôlé (`operation` seul, **sans cause sensible**). **Placeholder**
(`placeholder-adapter.ts`) : mémoire ; `setAvailability`/`setNextOutcome` simulent le device ; compteur
`authenticateCalls` (prouve que le service **gate** le prompt) ; no native dep / no persistance. **Service**
(`engine.ts`, agnostique) : `createBiometricService({adapter, logger?})` → `getAvailability` (gelé)/`isAvailable`/
`authenticate` ; **stateless** (ne stocke aucun résultat) ; **aucun faux succès** — `authenticate` vérifie la
disponibilité **d'abord** et renvoie `unavailable` **sans prompter** si le device est inutilisable, un adapter qui throw
→ `error`, un outcome inconnu → `error`, **ne throw jamais** ; **logs RN 8 sûrs** : `{availability,type}` / `{outcome}` /
`{operation}` — **jamais le prompt ni la cause native**. **+18 tests `node --test`** (`biometrics-model` : normalisation
availability/type/outcome incl. **junk → `unknown`/`error` jamais `success`**, type guards, objets **gelés**,
`isAvailabilityUsable`/`isAuthSuccess`, `describe*ForLog` enums ; `biometrics-engine` : `getAvailability`/`isAvailable`,
`authenticate` success/refused/cancelled/lockout/error, **device inutilisable → `unavailable` sans prompt**
(`authenticateCalls === 0`), **erreurs adapter contrôlées (`getAvailability`/`authenticate`) sans throw**, **junk →
`error`**, **logs sans prompt ni cause** (`operation` seul), placeholder) → **262 tests** ; module **entièrement
agnostique** (aucun hook/provider → rien en typecheck-only). Vérifs : **typecheck + lint + test 262/262 + expo-doctor
19/19 + git diff --check verts** (**RN 18 n'ajoute aucune dépendance**). **Aucun fichier `cores/api-nestjs`/`web-nextjs`/
`ui-kit`/`cloud`/`packages`/root modifié** ; aucun autre core. Commit `feat(mobile): add biometric gate primitives`.

**Étape précédente — Mobile Core React Native 17 — feature flags / config primitives génériques** (`cores/mobile-react-native/`,
périmètre `src/config` + `test/**` + docs) : **étend** les primitives de configuration (env) avec une **couche de
feature flags / config générique**, **pure et testable**, **sans SDK remote-config réel, sans réseau, sans persistance,
sans user targeting réel, sans secret/token/URL signée/payload serveur/PII, sans écran/hook obligatoire/provider
global**. `mobile-react-native` → **`FEATURE_FLAGS_READY`**. **Aucune dépendance ajoutée** ; **distinct des `flags` UI
Zustand RN 6** (config ≠ état UI local). **Modèle** (`src/config/flag-model.ts`, agnostique) : **`FlagValue`**
(`boolean`/`string`/`number`) + **`FlagSet`** ; bornes `MAX_FLAG_KEY_LENGTH` (64) / `MAX_FLAG_VALUE_LENGTH` (256) /
`MAX_FLAGS` (200) ; **`isValidFlagKey`** (identifiant borné) ; **`normalizeFlagValue`** (primitives ; **strings
bornées** ; non-finis/objets droppés) ; **`sanitizeFlagSet`** (clés valides + valeurs primitives, cap `MAX_FLAGS`,
**tolère tout input invalide** → `{}`) ; **getters typés à défaut sûr** `getBooleanFlag`/`getStringFlag`/`getNumberFlag`/
`getFlagValue<T>` (la valeur n'est rendue **que si le type correspond**, sinon le défaut) ; **`describeFlagsForLog`** →
**`{count}` UNIQUEMENT** (jamais clés ni valeurs). **Adaptateur** (`flag-adapter.ts`) : **`FlagAdapter`** (seam
local/remote-config : `getFlags(): FlagSet`/`subscribe?`/`refresh?`) + **`FlagAdapterError`** contrôlé (`operation`
seul). **Placeholder** (`placeholder-flag-adapter.ts`) : mémoire ; `setFlags` (assaini + notifie) simule une source ;
no native dep / no réseau / no persistance. **Service** (`flag-service.ts`, agnostique) :
`createFlagService({adapter, defaults?, logger?})` → résout `{...defaults, ...adapterFlags}` (assainis, **adapter >
defaults**) puis `getFlag(key, default)` (typé, **défaut sûr**), `getAll()` (copie), `subscribe`, `refresh()`
(best-effort, **ne throw jamais**), `dispose()` ; **best-effort non-intrusif** (erreurs adapter `getFlags`/`subscribe`/
`refresh` **capturées** + `warn` sûr, défauts conservés ; **listener qui throw isolé**) ; **logs RN 8 sûrs** : que des
**`{count}`** (au changement) / **`{operation}`** (en erreur) — **jamais clé ni valeur**. **+17 tests `node --test`**
(`config-flags` : validation clés, normalisation/bornage, `sanitizeFlagSet`, **getters à défaut sûr** sur type
mismatch, `describeFlagsForLog` **sans clé/valeur**, tolérance input invalide ; `config-flag-service` : résolution
defaults⊕adapter (**adapter gagne**), `getFlag`/`getAll`, **subscribe/unsubscribe déterministe**, changements adapter,
**refresh best-effort + erreur contrôlée**, **listener isolé**, **erreurs adapter contrôlées**, **logs sans clé/valeur**,
`dispose`, tolérance input invalide) → **244 tests** ; module **entièrement agnostique** (aucun hook/provider → rien en
typecheck-only). Vérifs : **typecheck + lint + test 244/244 + expo-doctor 19/19 + git diff --check verts** (**RN 17
n'ajoute aucune dépendance**). **Aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root
modifié** ; aucun autre core. Commit `feat(mobile): add generic feature flag primitives`.

**Étape précédente — Mobile Core React Native 16 — connectivité réseau (network status) primitives génériques** (`cores/mobile-react-native/`,
périmètre `src/offline` + `test/**` + docs) : **étend** les primitives offline de RN 3 avec une **couche de connectivité
générique**, **pure et testable**, **sans dépendance native** (NetInfo réel), **sans offline sync, sans rejeu auto, sans
persistance, sans écran/hook obligatoire/provider global**. `mobile-react-native` → **`NETWORK_STATUS_READY`**. **Aucune
dépendance ajoutée** ; **aucun module `src/network` concurrent** (la vérité réseau reste dans `src/offline`). **Modèle
étendu** (`network-state.ts`, additif) : RN 3 **inchangé** (`NetworkStatus`/`NetworkState`/`networkState`/`isOnline`/
`isOffline`/**`shouldQueueMutations`** = **API canonique**, queue sauf positivement `online`) ; ajouts :
`NetworkConnectionType` **borné** (`wifi`/`cellular`/`ethernet`/`other`/`none`/`unknown` — **jamais** SSID/carrier/IP) ;
`type?` optionnel sur `NetworkState` ; `NetworkSnapshot` ; **`normalizeNetworkStatus`** (booléen/strings → status ;
garbage → `unknown`) et **`normalizeConnectionType`** (tolérants, sans throw). **Adaptateur** (`network-adapter.ts`) :
`NetworkAdapter` (seam RN NetInfo : `getStatus(): NetworkSnapshot`/`subscribe`) + **`NetworkAdapterError`** contrôlé.
**Placeholder** (`placeholder-network-adapter.ts`) : mémoire ; `setStatus` (status nu ou `{status,type}`) simule un
changement OS ; no native dep. **Service** (`network-service.ts`, agnostique) : `createNetworkService({adapter, logger?,
clock?})` → `getStatus(): NetworkState`/`shouldQueue`/`subscribe`/`transition`/`dispose` ; **`changedAt` stampé sur
changement de STATUS** via **horloge injectée** (défaut `Date.now`) — type-only conserve `changedAt` (contrat RN 3) ;
**best-effort non-intrusif** (erreurs adapter `getStatus`/`subscribe` **capturées** + `warn` sûr, défaut `unknown` ;
**listener qui throw isolé**) ; **logs RN 8 sûrs** : que des **enums** (`{from,to,type}` au changement, `{operation}` en
erreur) — aucune donnée device/PII. **Intégration RN 3** : `shouldQueueMutations(service.getStatus())` reste canonique.
**+15 tests `node --test`** (`network-state` RN 3 **inchangé** — compat prouvée ; `network-status` : normalisation
status/type, `NetworkSnapshot`, `shouldQueueMutations` inchangé ; `network-service` : lecture initiale, **changements
adapter → service + subscribers**, `changedAt` sur status, type-only conserve `changedAt`, **subscribe/unsubscribe
déterministe**, **listener isolé**, **erreurs adapter contrôlées sans throw**, `dispose`, **logs enums seulement**) →
**227 tests** ; module **entièrement agnostique** (aucun hook/provider → rien en typecheck-only). Vérifs : **typecheck +
lint + test 227/227 + expo-doctor 19/19 + git diff --check verts** (**RN 16 n'ajoute aucune dépendance**). **Aucun
fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; aucun autre core. Commit
`feat(mobile): add generic network status primitives`.

**Étape précédente — Mobile Core React Native 15 — app lifecycle primitives génériques** (`cores/mobile-react-native/`, périmètre
`src/app-lifecycle` + `test/**` + docs) : ajoute une **couche générique de cycle de vie applicatif**, **pure et
testable**, **sans dépendance native** (RN `AppState` réel), **sans écran, sans hook obligatoire, sans provider global,
sans stockage, sans logique métier**. `mobile-react-native` → **`APP_LIFECYCLE_READY`**. **Aucune dépendance ajoutée.**
Prépare le **flush analytics (RN 13)**, le **refresh session au premier plan** et la **planif notifications (RN 10)** —
sans les implémenter. **État** (`src/app-lifecycle/state.ts`, agnostique) : **`AppLifecycleState`** (`active`/`background`/
`inactive`/`unknown`) ; `normalizeAppLifecycleState` (RN `AppStateStatus` incl. `extension`→`background` ; **tolère tout
input invalide** → `unknown`, jamais de throw) ; helpers `isForeground`/`isBackground`, **`isValidTransition`** (matrice :
même état no-op ; `unknown`→n'importe ; **un état déterminé ne revient jamais à `unknown`** ; états réels
interchangeables), **`nextAppLifecycleState`** (applique si valide, sinon conserve ; both inputs tolérés). **Adaptateur**
(`adapter.ts`) : `AppLifecycleAdapter` (seam RN `AppState` : `getState`/`subscribe`) + **`AppLifecycleAdapterError`**
contrôlé. **Placeholder** (`placeholder-adapter.ts`) : mémoire ; `setState` simule un changement OS ; no native dep.
**Service** (`engine.ts`, agnostique) : `createAppLifecycleService({adapter, logger?})` → `getState`/`subscribe`/
`transition`/`dispose` ; transitions **validées** ; **best-effort non-intrusif** (erreurs adapter `getState`/`subscribe`
**capturées** + `warn` sûr, défaut `unknown` ; **listener qui throw isolé**) ; **logs RN 8 sûrs** : que des **enums**
(`{from,to}` au changement, `{operation}` en erreur) — **aucune donnée utilisateur** ; **aucun `Date.now()`**. **+16
tests `node --test`** (`app-lifecycle-state` : normalisation incl. `extension`/garbage, `isValidTransition` matrice,
`nextAppLifecycleState` valide/ignoré/toléré ; `app-lifecycle-engine` : état initial, **changements adapter → service +
subscribers**, transition validée, **subscribe/unsubscribe déterministe**, no-op même état, **listener isolé**, **erreurs
adapter contrôlées sans throw**, `dispose`, **logs enums seulement**) → **212 tests** ; module **entièrement agnostique**
(aucun hook/provider → rien en typecheck-only). Vérifs : **typecheck + lint + test 212/212 + expo-doctor 19/19 + git
diff --check verts** (**RN 15 n'ajoute aucune dépendance**). **Aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/
`cloud`/`packages`/root modifié** ; aucun autre core. Commit `feat(mobile): add generic app lifecycle primitives`.
**Prochaine action : Mobile Core React Native 16 — connectivité réseau (network status) primitives génériques.**

**Étape précédente — Mobile Core React Native 14 — accessibilité (a11y) primitives génériques** (`cores/mobile-react-native/`, périmètre
`src/a11y` + `test/**` + docs) : ajoute une **couche d'accessibilité générique** (ADR-010 §16, spec §45), **pure et
testable**, **sans dépendance native** (`AccessibilityInfo` réel), **sans écran/composant UI, sans provider global
obligatoire, sans stockage**. `mobile-react-native` → **`A11Y_READY`**. **Aucune dépendance ajoutée.** **État**
(`src/a11y/state.ts`, agnostique) : `A11yRole` (sous-ensemble RN curé) ; **`A11yState`** = **quartet ADR-010 §16**
(`disabled`/`focused`/`pressed`/`invalid`) + RN `accessibilityState` (`selected`/`checked`/`busy`/`expanded`) ;
`isInteractiveRole`, `mergeA11yState` (override défini gagne), `describeA11yStateForLog` (booléens/enum seulement).
**Props** (`props.ts`) : `normalizeA11yText` (trim/collapse/**borne**), **`buildAccessibilityState`** (sous-ensemble RN
natif, drop `focused`/`pressed`/`invalid`), **`buildA11yProps`** (props RN-compatibles `accessible`/`accessibilityRole`/
`accessibilityLabel`/`accessibilityHint`/`accessibilityState`) ; **ne rend rien, n'importe pas React/RN, ne logge pas**
(labels = contenu utilisateur). **Annonce** (`announcement.ts`) : `A11yAnnouncement {message, assertive}` **borné** ;
`sanitizeAnnouncement` (sans throw) ; message **prononcé** (non redacté) mais **jamais loggé** → **`describeAnnouncementForLog`**
= `{length, assertive}` (sans texte). **Adaptateur + placeholder + service** : `A11yAdapter` (`announce`/`focus?`/
`isScreenReaderEnabled?`, `A11yFocusTarget {id}`) + **`A11yAdapterError`** contrôlé (seul `operation`) ;
`createPlaceholderA11yAdapter` (mémoire, no native dep) ; **`createA11yService`** (best-effort **non-intrusif** — ne
casse jamais le flux app, `isScreenReaderEnabled` **défaut `false`** en erreur, **logs RN 8 sûrs** `{length,assertive}`/
`{operation}` — jamais le texte brut). **Sécurité (07_SECURITY / ADR-010 §16)** : aucun contenu/label/message en log ;
aucun stockage ; aucune dépendance ; aucun provider global obligatoire. **+21 tests `node --test`** (`a11y-props-state` :
normalisation, rôle interactif, **merge d'états**, `buildAccessibilityState`, `buildA11yProps`, `describeA11yStateForLog`
sans contenu ; `a11y-announcement` : sanitize borné, **`describeAnnouncementForLog` sans texte** ; `a11y-engine` :
announce/focus/isScreenReaderEnabled, **erreurs adapter contrôlées — pas de throw**, **logger ne reçoit jamais le texte
brut**, `A11yAdapterError`) → **196 tests** ; module **entièrement agnostique** (aucun hook/provider → rien en
typecheck-only). Vérifs : **typecheck + lint + test 196/196 + expo-doctor 19/19 + git diff --check verts** (**RN 14
n'ajoute aucune dépendance**). **`DECISIONS_REGISTER` : ADR-010 reste `PARTIELLEMENT_IMPLEMENTE`** (note a11y ajoutée,
**aucun changement de statut**). **Aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root
modifié** ; aucun autre core. Commit `feat(mobile): add generic accessibility primitives`. **Prochaine action : Mobile
Core React Native 15 — app lifecycle / état d'application primitives génériques.**

**Étape précédente — Mobile Core React Native 13 — analytics / télémétrie primitives génériques (avec redaction, sans SDK réel)**
(`cores/mobile-react-native/`, périmètre `src/analytics` + `test/**` + docs) : ajoute une **couche générique
d'analytics/télémétrie** au-dessus du logger/redaction RN 8, **sans SDK réel** (Sentry/Amplitude/GA/Segment/Firebase/
OTel), **sans réseau, sans persistance, sans identité utilisateur réelle, sans logique métier, sans UI**.
`mobile-react-native` → **`ANALYTICS_READY`**. **Aucune dépendance ajoutée.** Le branchement d'un SDK réel relève d'un
**ADR/validation** côté projet dérivé. **Modèle + redaction** (`src/analytics/event.ts`, agnostique) : `AnalyticsEvent`
`{name, properties?, timestamp?}` ; properties **bornées aux primitives**. **Redaction dédiée mais BASÉE sur RN 8**
(pas de contournement) : `isSensitiveProperty` **réutilise `isSensitiveKey` (RN 8)** + couche normalisée exact/substring
(même durcissement que le filtre de liens RN 12) ; **`sanitizeAnalyticsEvent`** (jamais de throw) **supprime les clés
sensibles** (token/secret/signature/credential/password/authorization/apiKey/auth/jwt/otp/key/code/sig/email/phone/…),
**scrube les valeurs string via `redactString` (RN 8)** (Bearer/JWT/device-uri/URL signée/email) et **borne**
count/longueur. `describeAnalyticsEventForLog` → **`{eventName, propertyCount}`** (jamais de valeur). **Adaptateur**
(`adapter.ts`) : `AnalyticsAdapter` — `track(event)` (déjà assaini), `flush?()`. **PAS de `identify`** *par design* (pas
d'identifiant utilisateur réel dans la fondation ; un projet dérivé l'ajoute sous sa propre revue privacy). **Service**
(`engine.ts`, agnostique) : `createAnalyticsService({adapter, logger?})` → `track(name, properties?)` **assaini avant**
l'adapter ; **best-effort / non-intrusif** : un adapter qui échoue **ne casse jamais** le flux app (erreur capturée +
`warn` **sûr** sans cause sensible) ; **logs RN 8 sûrs** `{eventName, propertyCount}` — **jamais les valeurs** ;
`flush()` best-effort ; **aucun `Date.now()`**. **Placeholder** (`placeholder-adapter.ts`) : buffer **mémoire POUR
TESTS** (`getEvents`/`clear`), **aucun SDK/réseau/persistance**. **+16 tests `node --test`** (`analytics-event` :
`isSensitiveProperty`, bornage, **clés sensibles supprimées**, **valeurs scrubbées (RN 8)**, **valeur longue tronquée**,
**sans throw**, `describeAnalyticsEventForLog` sans valeur ; `analytics-engine` : événement assaini dans l'adapter,
**l'adapter ne reçoit jamais de valeur sensible**, **erreur adapter contrôlée — track ne throw pas**, **logger ne reçoit
que `{eventName,propertyCount}`**, `flush` délégué/no-op/échec contrôlé, **sans throw**) → **175 tests** ; module
**entièrement agnostique** (aucun hook → rien en typecheck-only). Vérifs : **typecheck + lint + test 175/175 +
expo-doctor 19/19 verts** (**RN 13 n'ajoute aucune dépendance**). **Aucun fichier `cores/api-nestjs`/`web-nextjs`/
`ui-kit`/`cloud`/`packages`/root modifié** ; aucun autre core. Commit `feat(mobile): add generic analytics telemetry
primitives`. **Prochaine action : Mobile Core React Native 14 — accessibilité (a11y) primitives génériques.**

**Étape précédente — Mobile Core React Native 12 — deep-linking / routing primitives génériques** (`cores/mobile-react-native/`, périmètre
`src/linking` + `test/**` + docs) : ajoute une **couche pure de résolution de liens/deep-links vers routes internes
validées**, **sans dépendance native, sans logique métier, sans UI, sans schéma métier**. `mobile-react-native` →
**`LINKING_READY`**. **Aucune dépendance ajoutée.** Prépare le **tap de notification (RN 10)** ; **les projets dérivés
définissent leurs routes concrètes**. **Parseur pur** (`src/linking/url.ts`, agnostique) : `parseDeepLink` →
`{scheme,host,path,query,fragment}` — gère **custom schemes** (`myapp://home/details?id=1`) **et** `https` universal
links, **sans** le `URL` global (comportement variable RN/Hermes/Node) → **déterministe** ; `decodeSafe`
(`decodeURIComponent` **sans throw**), `normalizeUrl` (trim + scheme/host minuscule). **Modèle/résolution**
(`src/linking/resolve.ts`, agnostique) : **`LinkResolution`** = **`internal`** (route sûre) / **`externalBlocked`**
(`external_scheme`/`external_host`/`insecure_scheme`/`open_redirect`) / **`invalid`** (`empty`/`unparseable`/
`unsafe_path`) ; `LinkingConfig` (**allowlist** `schemes` custom + `https`, `hosts`, `sensitiveParams`, bornes).
**Sécurité (07_SECURITY §7/§8)** : **allowlist stricte** (**`http` → `insecure_scheme`**) ; **anti-open-redirect** (une
route encodant `//authority` ou `scheme://` absolu → bloquée ; traversal `..`/`.` → `unsafe_path`) ; **params sensibles
supprimés** (token/secret/code/signature/key/jwt/otp/… + config) — **jamais conservés**, aucune URL complète gardée ;
**bornes** (count/longueur/path) ; `isInternalRoute`. **Intégration notification** : `resolveNotificationLink(data,
config, options?)` lit une **clé configurable** (défaut `link`) du `data` (RN 10), **sans supposition métier** ;
absente/non-string → `invalid`. **Gouvernance** : **aucun log** (donc aucune query sensible loggée), **aucun stockage**
de lien/token/URL, **aucune dépendance** (parseur maison) ; la navigation réelle appartient au projet dérivé. **+15
tests `node --test`** (`linking-url` : decodeSafe **sans throw**, parseDeepLink custom/https/relatif/invalide,
normalizeUrl ; `linking-resolve` : custom valide, universal valide, **host externe bloqué**, **http bloqué**,
**open-redirect** `//`/`scheme://`/`..` bloqué/rejeté, **params sensibles retirés**, **bornes**, **input invalide sans
throw**, `resolveNotificationLink` clé configurable) → **159 tests** ; module **entièrement agnostique** (aucun hook →
rien en typecheck-only). Vérifs : **typecheck + lint + test 159/159 + expo-doctor 19/19 verts** (**RN 12 n'ajoute aucune
dépendance**). **Aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; aucun autre
core. Commit `feat(mobile): add generic deep-linking routing primitives`. **Prochaine action : Mobile Core React Native
13 — analytics / télémétrie primitives génériques (avec redaction, sans SDK réel).**

**Étape précédente — Mobile Core React Native 11 — i18n / localisation primitives génériques** (`cores/mobile-react-native/`, périmètre
`src/i18n` + `test/**` + docs) : ajoute des **primitives i18n/localisation génériques**, testables, **sans contenu
métier, sans dépendance native, sans appel réseau, sans persistance de locale, sans UI**. `mobile-react-native` →
**`I18N_READY`**. **Aucune dépendance ajoutée** (tout via `Intl` built-in). **Modèle de locale** (`src/i18n/locale.ts`,
agnostique) : `LocaleCode`/`LocaleDirection`/`DEFAULT_LOCALE` ; `normalizeLocale` canonicalise casse/séparateurs
(`_`→`-`) via **`Intl.getCanonicalLocales`** (`EN_us`→`en-US`, `zh_hant_tw`→`zh-Hant-TW`) → invalide → **fallback**
(jamais de throw) ; `getLanguageSubtag`, `getLocaleDirection` (RTL ar/he/fa/ur…), `resolveLocale` (exact → langue seule
→ fallback → premier dispo). **Catalogue typé** (`catalog.ts`) : `MessageCatalog` (map plate) ; `interpolate` (`{name}`,
placeholder inconnu **laissé tel quel**) ; `createTranslator` → `t`/`has`/`plural` : clé absente → fallback catalogue →
`onMissing` → la clé (**jamais de throw**) ; `plural` via **`Intl.PluralRules`** (CLDR, `{count}`, repli `.other`).
**Formatters `Intl`** (`format.ts`) : `formatNumber`/`formatDate`/`formatCurrency` — **ne lèvent jamais** ; **pas de
devise métier par défaut** (`formatCurrency` exige le code ISO-4217) ; valeurs en argument (pas de `Date.now()`).
**Adaptateur + placeholder + service** : `LocaleAdapter` (seam Expo : `getLocale`/`subscribe?`) ;
`createPlaceholderLocaleAdapter` (**mémoire, no native dep, no persistence** ; `setLocale` normalise + notifie) ;
`createLocalization({adapter, catalogs, fallbackLocale?})` résout la locale active (clés normalisées), borne un
`Translator` et **pré-lie** les formatters ; expose `locale`/`direction`/`t`/`plural`/`formatDate`/`formatNumber`/
`formatCurrency`. **Catalogues métier = projets dérivés.** **+22 tests `node --test`** (`i18n-locale` : normalisation/
fallback/direction/résolution ; `i18n-catalog` : interpolation, clé inconnue **sans throw**, fallback, pluralisation
en/fr ; `i18n-format` : number/currency/date déterministes UTC, **no-throw** ; `i18n-engine` : résolution, fallback,
match langue, formatters liés, `subscribe`) → **144 tests** ; module **entièrement agnostique** (aucun hook → rien en
typecheck-only). Vérifs : **typecheck + lint + test 144/144 + expo-doctor 19/19 verts** (**RN 11 n'ajoute aucune
dépendance**). **Aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; aucun autre
core. Commit `feat(mobile): add generic i18n localization primitives`. **Prochaine action : Mobile Core React Native 12
— deep-linking / routing primitives génériques.**

**Étape précédente — Mobile Core React Native 10 — notifications client (primitives locales génériques, sans push réel)**
(`cores/mobile-react-native/`, périmètre `src/notifications` + `test/**` + docs) : ajoute une **couche générique de
primitives de notifications locales** au-dessus du modèle permissions RN 9, **sans push réel, sans Expo Notifications
réel, sans backend, sans token device, sans logique métier, sans UI**. `mobile-react-native` → **`NOTIFICATIONS_READY`**.
**Aucune dépendance ajoutée.** **Message sûr** (`src/notifications/message.ts`, agnostique) : `NotificationMessage`
`{title,body,data?}` **borné** (`MAX_TITLE_LENGTH`/`MAX_BODY_LENGTH`/`MAX_DATA_KEYS`/`MAX_DATA_VALUE_LENGTH`) ;
`sanitizeNotificationMessage` trim+cap title/body et ne garde dans `data` que des **primitives** (objets/arrays/fonctions
droppés). **Sécurité (07_SECURITY §13 / ADR-040)** : title/body/data = **contenu** (PII possible) → **jamais loggés** ;
`describeNotificationForLog` → **métadonnées seules** (`{titleLength,bodyLength,dataKeyCount}`). **Aucun push/device
token** dans un message. **Modèle** (`types.ts`) : `NotificationDeliveryState` + gardes ; **trigger borné**
`NotificationTrigger` (`immediate`/`delay{seconds≥0}`/`date{timestamp}`) + `normalizeTrigger` ; `NotificationAdapter`
(seam Expo : `getPermissionStatus`/`requestPermission`/`scheduleLocal`/`cancel`/`cancelAll`/`getDelivered?`). **Service**
(`engine.ts`, agnostique) : `createNotificationService({adapter, permissionService?, logger?})` — **réutilise RN 9**
(pilote un `PermissionService` pour le kind `notifications`, injecté ou construit depuis l'adapter). **`schedule`** :
`ensure('notifications')` → **si `!isPermissionUsable` → `{state:'blocked', reason:'permission', status}` SANS toucher
l'adapter** (jamais de schedule sans permission usable) ; sinon message assaini + trigger normalisé → `scheduleLocal` →
`{state:'scheduled', id}`. `cancel`/`cancelAll`/`getDelivered` (no-op `[]` si non supporté). **Logs RN 8 sûrs**
(`{id}`/`{status}`/`{state}`/`{count}` — **jamais le contenu**) ; échec adapter → **`NotificationError`** contrôlé (seul
`operation`, **aucune cause sensible**). **Placeholder** (`placeholder-adapter.ts`) : **simulation mémoire, AUCUNE
dépendance native** ; ids = **compteur déterministe** (`local-1`/`local-2`… → pas de `Date.now()`/`Math.random()`) ;
jamais persisté. **+16 tests `node --test`** (`notification-message` : bornage title/body/data, garde,
`describeNotificationForLog` **sans contenu**, `normalizeTrigger` ; `notification-engine` : **permission refusée → pas
de schedule**, granted/limited/unknown→request → schedule, `cancel`/`cancelAll`, **erreur adapter → `NotificationError`
sans cause brute**, `getDelivered` no-op, **aucune donnée sensible loggée**) → **122 tests** ; module **entièrement
agnostique** (aucun hook → rien en typecheck-only). Vérifs : **typecheck + lint + test 122/122 + expo-doctor 19/19
verts** (**RN 10 n'ajoute aucune dépendance**). **Aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/
`packages`/root modifié** ; aucun autre core. Commit `feat(mobile): add generic local notification primitives`.
**Prochaine action : Mobile Core React Native 11 — i18n / localisation primitives génériques.**

**Étape précédente — Mobile Core React Native 9 — permissions natives génériques gouvernées** (`cores/mobile-react-native/`, périmètre
`src/permissions` + `test/**` + docs) : ajoute une **abstraction générique, testable et gouvernée** des permissions
runtime mobiles, **sans logique métier, sans écran/picker, sans notification push réelle, sans upload réel**.
`mobile-react-native` → **`PERMISSIONS_READY`**. **Aucune dépendance ajoutée.** **Modèle pur**
(`src/permissions/status.ts`, agnostique) : `PermissionKind` (`camera`/`mediaLibrary`/`notifications`/
`locationForeground`) + **`PermissionStatus`** (`unknown`/`granted`/`denied`/`blocked`/`limited`/`unavailable`) ;
`normalizePermissionStatus` replie chaînes (`granted`/`undetermined`/`never_ask_again`/`restricted`…), booléens et
objets Expo `{status,granted,canAskAgain}` (`canAskAgain:false`⇒`blocked`) en **un seul** enum, **conservateur**
(inconnu → `unknown`, jamais `granted`) ; helpers purs `canRequestPermission`/`isPermissionGranted` (strict)/
`isPermissionUsable` (granted+limited)/`shouldOpenSettings`/`isPermissionStatus`. **Adaptateur** (`adapter.ts`) :
`PermissionAdapter` seam Expo (`getStatus`/`request`/`openSettings?`). **Service** (`engine.ts`, agnostique) :
`createPermissionService({adapter, logger?})` → `getStatus` (**live, jamais caché**), `request`, **`ensure`** (prompt
uniquement si grantable et pas déjà accordé), `openSettings` ; **statut jamais persisté** (ni SecureStore/Zustand/
Query, ADR-015) ; **logs via le logger RN 8** avec **champs sûrs uniquement** (`{kind,status}` enums), redaction RN 8
**non contournée** ; échec adaptateur → **warn `{kind}` + `PermissionAdapterError`** contrôlé (seulement `kind`/
`operation`, **aucune cause sensible**), jamais de faux `granted`. **Placeholder** (`placeholder-adapter.ts`) :
`createPlaceholderPermissionAdapter` — **simulation mémoire, AUCUNE dépendance native** ; `openSettings` no-op
documenté. **Hook** (`use-permission.ts`, typecheck-only) : `usePermission(kind, adapter, options?)` → `{status,
loading, error}` + `request`/`refresh`/`openSettings`, **no UI**, statut live en state composant (jamais persisté),
garde de démontage. **Sécurité** (07_SECURITY §6) : une permission device est une **capacité locale**, **pas** une
barrière de sécurité → **API Core = autorité**. **+17 tests `node --test`** (`permission-status` : normalisation
chaînes/objets/booléens, idempotence, conservatisme, helpers ; `permission-engine` : lecture, request **accordé/
refusé**, `ensure`, `blocked`/`unavailable` sans prompt, **erreur adaptateur → `PermissionAdapterError` sans cause
brute**, `openSettings` supporté/non, **aucune donnée sensible loggée**) → **106 tests** ; le hook (React) est
**typecheck** seulement. Vérifs : **typecheck + lint + test 106/106 + expo-doctor 19/19 verts** (**RN 9 n'ajoute aucune
dépendance**). **Aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; aucun autre
core. Commit `feat(mobile): add generic governed runtime permissions`. **Prochaine action : Mobile Core React Native 10
— notifications client (cadrage + primitives génériques, sans push réel).**

**Étape précédente — Mobile Core React Native 8 — logger / observabilité client (avec redaction)** (`cores/mobile-react-native/`,
périmètre `src/logger` + `src/upload/file.ts` (correctif `describeFileForLog`) + `test/**` + docs) : ajoute une
**couche de logging/observabilité générique** avec **redaction stricte**, **sans endpoint métier, sans backend
d'observabilité, sans transport réseau ni persistance**. `mobile-react-native` → **`OBSERVABILITY_READY`**. **Aucune
dépendance ajoutée.** **Redaction centrale** (`src/logger/redaction.ts`, **agnostique**) : l'**unique** endroit qui
décide de la sensibilité (ADR-040 §17). `redactValue` masque récursivement (gardes **profondeur** + **cycle**, sans
mutation) les **clés sensibles** (`isSensitiveKey`, normalisées → `access_token`/`Access-Token`/`accessToken` matchent,
`author`/`monkey` non) ; `redactString` masque dans le **texte libre** : **chemins device** (`file://`/`content://`/
`ph://`, schéma conservé), **`Bearer`/`Basic`**, **JWT**, **params d'URL signée** (`X-Amz-Signature`/`Credential`,
`token`, `sig`…), **emails**. `Error` → `{name, message}` redacté **sans stack**. Marqueur `[Redacted]`. **Logger**
(`src/logger/logger.ts`, agnostique) : `createLogger` → `debug`/`info`/`warn`/`error` ; **toute** sortie (message **et**
champs) redactée **avant** le sink → un token ne fuit pas **même via un sink custom** ; **niveaux** (`isLevelEnabled`,
défaut `info`), **sink pluggable** (défaut `consoleSink` — `console` = sink plateforme, **pas** un transport réseau),
**horloge injectée** (jamais `Date.now()` dans le chemin testé), **corrélation** `child(context, fields?)` /
`withRequestId(id)` (ADR-040 §14) ; **aucun log automatique de body** (§18). **Pont erreurs** (`error-fields.ts`) :
`safeErrorFields(QueryError)` → `{kind,status,errorCode,requestId}` (corrélation conservée, **message/payload droppés** ;
import **type-only** → `src/query` **non modifié**). **Correctif `describeFileForLog`** (`src/upload/file.ts`) : ne
renvoie **plus le nom brut** (PII potentielle, §18/§22) → `SafeFileDescriptor = {type, extension}` (MIME + extension
assainie `[a-z0-9]{1,12}`, sinon `null`), **jamais** l'`uri` ni le `name` (seule modification autorisée de `file.ts` ;
test `upload-file` adapté). **Non fourni (mission / §24)** : aucune persistance, transport réseau, service externe
(Sentry/Datadog/Loki) ni log de body ; le `console.warn` de `src/storage` **non** recâblé (hors périmètre) → **aucun
changement de comportement**. **+18 tests `node --test`** (`logger-redaction` : clés/casse, cycles, `Error` sans stack,
Bearer/Basic/JWT/device-uri/URL signée/email, profondeur ; `logger` : niveaux, horloge injectée, redaction au logger,
`child`/`withRequestId`, `safeErrorFields`) → **89 tests** ; module **entièrement** agnostique (rien en typecheck-only).
Vérifs : **typecheck + lint + test 89/89 + expo-doctor 19/19 verts** (**RN 8 n'ajoute aucune dépendance**). **Aucun
fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; aucun autre core. Commit
`feat(mobile): add client logger with central redaction`. **Prochaine action : Mobile Core React Native 9 —
permissions natives génériques (gouvernées).**

**Étape précédente — Mobile Core React Native 7 — primitives d'upload sécurisé multipart** (`cores/mobile-react-native/`, périmètre
`src/query` + `src/upload` + tests + docs) : ajoute des **primitives d'upload génériques** au-dessus du client
officiel et des couches auth/server-state — **sans endpoint métier, sans écran, sans picker, sans logique applicative**.
`mobile-react-native` → **`UPLOAD_READY`**. **Aucune dépendance ajoutée.** **Descripteur RN** (`src/upload/file.ts`,
**agnostique/pur**) : `MobileFile {uri,name,type}` défini localement, **structurellement assignable** au
`ReactNativeFileDescriptor` du package → passable tel quel à `apiClient.files.upload`. Helpers **purs** : `isMobileFile`
(garde de forme), **`describeFileForLog`** (descripteur sûr `{name,type}` — **jamais l'`uri`**, chemin device potentiel),
`isAllowedFileType` (**pré-check UX** exact/`image/*`/`*/*` ; **backend autoritaire**, ADR-007). **Mutation**
(`src/upload/use-upload.ts`) : `useUploadMutation` via **`useAuthedMutation`** → `apiClient.files.upload(file, category,
{subjectId, retryOnAuthRefresh:false})` → POST `multipart/form-data` vers **`POST /files`** (endpoint **fondation**, pas
métier). **Refresh 401 possédé par l'AuthEngine** (`authedRequest` ; le client ne refresh pas, `enableRefresh:false`) ;
le **`FormData` est reconstruit depuis `file`** au retry (jamais de flux consommé). **Sécurité** (ADR-007/015) : c'est
une **mutation** → **aucune clé de cache**, résultat **transient** ; **aucun fichier/URL signée/token/Authorization** en
query key, cache durable, log ou store local ; l'upload renvoie **uniquement les métadonnées publiques**
(`PublicStoredFileDto`). `toQueryError` **étendu** : **413** « too large » / **415** « not supported ». **Réserve RN 6
clarifiée** : le store UI **n'est PAS** réinitialisé au logout (aucune donnée sensible → pas de fuite) ; `useUiStore.reset()`
reste **exposé** ; câbler `signOut → reset()` vivrait dans `AuthProvider` (`src/auth`, **hors périmètre RN 7**) → **non
câblé, aucun changement de comportement**. **+4 tests `node --test`** (`upload-file` : `isMobileFile`, `describeFileForLog`
**sans fuite d'`uri`**, `isAllowedFileType` ; `query-errors` 413/415) → **71 tests** ; le hook (React/TanStack/ESM) est
**typecheck** seulement. Vérifs : **typecheck + lint + test 71/71 verts** (expo-doctor : checks locaux verts ; checks
réseau Expo/RN-Directory flappent — **RN 7 n'ajoute aucune dépendance**). **Aucun fichier `cores/api-nestjs`/`web-nextjs`/
`ui-kit`/`cloud`/`packages`/root modifié** ; aucun autre core. Commit `feat(mobile): add secure multipart upload
primitives`. **Prochaine action : Mobile Core React Native 8 — logger/observabilité client (avec redaction).**

**Étape précédente — Mobile Core React Native 6 — état local UI + purge logout déterministe** (`cores/mobile-react-native/`, périmètre
`src/auth` + `src/query` + `src/store` + tests + docs) : ajoute un **état local UI générique** (séparé du
server-state) et **câble le logout** pour purger le cache TanStack Query de façon déterministe. **Zustand approuvé**
(strategy 06 « Local state: Approved » ; spec §23) ajouté à `cores/mobile-react-native` (`^5`, **0 dépendance**).
**Store** `src/store/` : `ui-state.ts` (**pur/agnostique** : modèle + transitions immutables) + `ui-store.ts`
(`useUiStore`). État = **uniquement primitives UI non sensibles** : `themePreference` (`'system'|'light'|'dark'`) +
`flags` (`Record<string,boolean>`) + `reset()`. **Sécurité structurelle** : le type n'autorise qu'un enum + des
booléens → **aucun token/profil/URL signée/payload serveur** ne PEUT y être stocké (ADR-015 ; anti-pattern spec §57).
**In-memory, sans persistance**. **Purge déterministe** : `purgeServerState` devient `async` → **`await cancelQueries()`
PUIS `clear()`**. **Câblage** : `AuthProvider` purge **dès que la session se termine** (`unauthenticated` via `signOut`
**ou** `expired`/`clearSession` interne) — un seul mécanisme couvre tous les chemins ; **AuthEngine INCHANGÉ** (la
purge vit dans la couche React). `mobile-react-native` → **`LOCAL_STATE_READY`**. **+8 tests `node --test`** (ui-state ;
invalidation : ordre déterministe `cancel`→`clear`) → **67 tests** ; binding Zustand + effet `AuthProvider`
**typecheckés**, hors build Node. Vérifs : **typecheck + lint + test 67/67 verts** (expo-doctor : checks locaux verts ;
checks réseau Expo/RN-Directory flappent dans cet env — 19/19 obtenu plus tôt ; zustand 0-dep non en cause). **La garde
CI `npm ls zustand` (root) reste verte** : le mobile est autonome (hors workspaces racine), son Zustand n'est pas dans
le scope `npm ls` du root (intent ADR-012 « pas de Zustand dans le Web » préservé). **Aucun fichier `cores/api-nestjs`/
`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; aucun autre core. Commit `feat(mobile): add local ui state and
deterministic logout purge`. **Prochaine action : Mobile Core React Native 7 — upload sécurisé (multipart).**

**Étape précédente — Mobile Core React Native 5 — couche server-state** (`cores/mobile-react-native/`, périmètre `src/query/**` + tests +
docs) : ajoute une couche **server-state générique** au-dessus de **TanStack Query** (ADR-012) et du client officiel,
**sans endpoint ni schéma métier**. **Query keys** (`createQueryKeys(scope)`, agnostique) : fabrique namespacée,
typée, **stable** (`normalizeParams` : clés triées, `undefined` retiré → cache hit) ; aucun secret dans une clé.
**Appels authentifiés OBLIGATOIRES via `authedRequest`** : `useAuthedQuery`/`useAuthedMutation` enveloppent le
`queryFn`/`mutationFn` dans `authedRequest` (pont 401 RN 4B) → `401 → AuthEngine.refreshSession() coalescé → 1 retry →
purge` ; lectures publiques = `useQuery` simple. **Retry** : `QueryClient` ne retente **jamais** un 401 (surface
l'`ApiClientError`) ; **mutations sans retry** ; refresh sur 401 = **exclusivement AuthEngine** (aucune 2ᵉ stratégie).
**Erreurs UI** : `toQueryError` → `{kind,status,errorCode,requestId,isUnauthorized/Forbidden/NotFound,message}` ;
`ApiClientError` lu **structurellement** (sans import ESM) ; **`message` générique figé** par kind/status (n'écho jamais
le message brut/token/URL signée — ADR-016 §28). **Invalidation/purge** : `invalidateScope`/`removeScope` +
**`purgeServerState(queryClient)`** (= `cancelQueries` + `clear`) au logout (ADR-015 §18) ; le **déclencheur** est dans
`src/auth` (hors périmètre) → câblage `signOut → purgeServerState` documenté (= RN 6). **Pas de persistance de cache**.
`mobile-react-native` → **`SERVER_STATE_READY`**. **+12 tests `node --test`** (query-keys, query-errors : non-fuite du
message brut) → **59 tests** ; hooks/invalidation **typecheckés**, hors build Node. Vérifs : **typecheck + lint +
test 59/59 + expo-doctor 19/19 verts**. **Aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/
root modifié** ; aucun autre core. Commit `feat(mobile): add server-state data layer`. **Prochaine action : Mobile
Core React Native 6 — état local (Zustand) + câblage `signOut → purgeServerState`.**

**Étape précédente — Mobile Core React Native 4B — restauration du `401 → refresh → retry`** (`cores/mobile-react-native/`) : corrige une
régression RN 4 (le client en `enableRefresh:false` + adaptateur no-op → plus de `401`→refresh→retry). Ajoute un **pont
401 explicite** `src/api/with-auth-retry.ts` (pur/agnostique) : `authedRequest(fn)` = `withAuthRetry(engine.refreshSession,
fn)` → sur `401` (détecté par `error.isUnauthorized`, sans import ESM) → **`AuthEngine.refreshSession()` COALESCÉ** → **1
seul retry** (relit le Bearer rafraîchi) → si `null` (session **purgée** → `expired`) le 401 est **surfacé** (pas de boucle).
**Une seule stratégie de refresh** (`enableRefresh:false` conservé ; l'AuthEngine reste le propriétaire) ; `MobileAuthSessionAdapter`
étendu (`bind({ getAccessToken, refreshSession })`). Access token **toujours en mémoire**. **Test restauré** (`with-auth-retry.test.ts`,
6 cas) équivalent à l'ancien `401→refresh→retry` → **47 tests**. Statut **inchangé `API_CLIENT_INTEGRATED`**. Vérifs :
**typecheck + lint + test 47/47 + expo-doctor 19/19 verts**. **Aucun fichier API/Web/UI Kit/Cloud/`packages` modifié** ; root
non touché. Docs : `ARCHITECTURE.md` §12 (pont 401) + `README.md`. Commit `fix(mobile): restore 401 refresh retry with official
client`. **Prochaine action : Mobile Core React Native 5 — server-state data layer.**

**Étape précédente — Mobile Core React Native 4 — intégration réelle du client officiel** (`cores/mobile-react-native/`, faisant suite
à RN 1→3) : **remplace** le transport « seam » local par **`@enistere/api-client-fetch` + `@enistere/api-contracts`**
(ADR-016). **Consommation = core autonome + packages liés `file:`** (écart **validé avec l'utilisateur** : ne PAS
ajouter l'app Expo SDK 55 au lockfile racine partagé qui pilote le `npm ci` de toute la CI monorepo — risque
web/ui-kit/CI pour zéro bénéfice) : `file:../../packages/*` + **`metro.config.js`** (watchFolders + `import`
conditions) + `openapi-fetch` déclaré directement (pas de React dupliqué) ; **root `package.json` NON modifié**.
`src/api` = `createEnistereApiClient({ baseUrl, timeoutMs, session, enableRefresh:false })` ; **`MobileAuthSessionAdapter`**
(injection Bearer de l'access token **en mémoire**, le client ne stocke aucun token — §27) ; **`EnistereAuthApi`**
(POST `/auth/login`+`/auth/refresh` via `client.raw` typé → mapping pur `toAuthSessionData`, `expiresIn` s→ms) ;
`PlaceholderAuthApi` en repli ; `SignInInput` `username`→**`email`**. **AuthEngine INCHANGÉ** (refresh coalescé +
expiration proactive + 401→refresh→retry préservés ; le refresh reste possédé par l'AuthEngine). `mobile-react-native`
→ **`API_CLIENT_INTEGRATED`**. **47 tests `node --test`** (retrait des 6 tests de l'ancien transport ; ajout
token-mapping ; logique réseau du client testée **dans son package** = 29). **+ `babel-preset-expo@~55.0.8`** ajouté
(référencé par `babel.config.js` mais jamais déclaré — lacune RN 1–3 ; rend le core **bundle-able**). Vérifs :
**typecheck (types réels) + lint (0) + test 47/47 + expo-doctor 19/19 + `expo export -p ios` (bundle Hermes 2,7 Mo
**embarquant** `createEnistereApiClient`/`/auth/login`/`/auth/refresh`) verts** ; packages liés `api-contracts` 11/11
+ `api-client-fetch` 29/29 (inchangés). **Aucun fichier `cores/cloud`/`api-nestjs`/`web-nextjs`/`ui-kit`/`packages`
modifié** ; **aucun autre core démarré** ; Cloud reste **`PAUSE_CONTROLEE`**, staging **`EXECUTION_LOCALE_CONTROLEE`**.
Commit `feat(mobile): integrate official api-client-fetch`. **Prochaine action : Mobile Core React Native 5 —
server-state data layer (hooks TanStack Query au-dessus du client officiel)**.

**Étape précédente — Mobile Core React Native 3 — forms, validation & offline-ready primitives** (`cores/mobile-react-native/`,
faisant suite à RN 1 starter PR #11 et RN 2 auth/session hardening) : ajoute des **formulaires génériques** et la
**validation UX** (**React Hook Form + Zod** : `FormField`/`FormLabel`/`FormError`/`TextInputField` token-driven,
erreurs **accessibles** ; helpers agnostiques `validateWith` + `zodErrorToFieldErrors` — **client = UX uniquement,
backend autoritatif** ADR-003 §18, **aucun DTO/schéma métier**) et des **primitives offline préparatoires**
(`src/offline` : état réseau **abstrait** + **queue mémoire** FIFO `enqueue`/`dequeue`/`peek`/`clear` ; **sans**
persistance, **sans** rejeu auto, **sans** NetInfo/MMKV/AsyncStorage/SQLite, **sans** donnée sensible — ADR-015 §19,
spec §37). `mobile-react-native` → **`FORMS_OFFLINE_PRIMITIVES_READY`**. **44 tests `node --test`** (21 RN 2 + 23
nouveaux) ; **typecheck + lint + test 44/44 + expo-doctor 19/19 verts**. **Dette doc corrigée** : ADR-015
`DECIDE_NON_IMPLEMENTE` → **`PARTIELLEMENT_IMPLEMENTE`** ; ADR-010/011/012 reflètent l'avancement mobile réel ;
ADR-003 note la validation cliente mobile. **Aucun fichier `cores/cloud`/`api-nestjs`/`web-nextjs`/`ui-kit`/
`packages` modifié** ; **aucun autre core démarré** ; Cloud reste **`PAUSE_CONTROLEE`**, staging
**`EXECUTION_LOCALE_CONTROLEE`**. Commit `feat(mobile): add forms validation and offline-ready primitives`.
**Prochaine action : Mobile Core React Native 4 — intégration réelle de `@enistere/api-client-fetch`** (workspace
racine + Metro monorepo).

**Étape précédente — Cloud Core 9 — exécution staging contrôlée** (`cores/cloud/docs/STAGING_EXECUTION_REPORT.md`) : **exécution
réelle des conteneurs** (API+Web+PostgreSQL+MinIO) à partir des **images GHCR corrigées** (`sha-d1e6242`), en
environnement **Type D : local, sans exposition publique**. **Aucun serveur distant/Hetzner/VM/SSH/DNS/HTTPS
identifié** → mission **requalifiée honnêtement** en exécution **locale** (consigne §6 : ne pas prétendre à un
staging réel sans serveur). `.env.staging` **réel hors dépôt** (`/tmp`, `chmod 600`, secrets `openssl` jetables,
**shred** après ; sur serveur réel : `/opt/enistere/staging/`). **Résultats** : `compose config` **valide**
(**0 `latest`**) ; images corrigées **tirées** ; **postgres `healthy`** + **minio `Up`** + bucket privé ;
**migrations DEPUIS l'image** (Option A, **offline**, 5 appliquées) ; **API `Up (healthy)`** + **Web `Up
(healthy)`** ; `/health/live`+`/health/ready`+`/`+`/login` = **200** ; `/protected` anonyme = **200 sans
`Location`** (**redirection App-Router streaming** RSC `NEXT_REDIRECT`/meta-refresh — honorée par le navigateur,
**documentée**, aucune donnée privée) ; **endpoint MinIO Option A** (`S3_ENDPOINT=http://<host>:9000`)
**joignable** par le conteneur ET l'hôte (navigateur). ⚠️ **Non validé** : **URL signée bout-en-bout** (l'URL
pré-signée par `mc` → **403** côté hôte ; **presign de l'API non exercé**) et **Auth/Files** applicatifs
(**aucun utilisateur staging** : seed RBAC nécessite `ts-node`/devDeps + egress npm, **indisponibles**).
**Sécurité** : staging **technique interne local, NON sécurisé production** (pas d'HTTPS/DNS/pare-feu ; MinIO
console locale seulement ; PostgreSQL non publié). **Décision §20** : **arrêt** après validation (`down -v`,
volumes + secrets **jetables** supprimés). **Rollback** documenté (vers tags **post-CC8** seulement). **Aucune**
modif `cores/*/src`/`packages`/`docs/adr`/`strategy`/Dockerfiles/workflows ; **aucun secret/`latest`/déploiement
réel**. Statut **`EXECUTION_LOCALE_CONTROLEE`**. Commit `docs(cloud): record controlled staging execution` (via
PR). **Prochaine action : Cloud Core 10 — préparation serveur staging sécurisé** (serveur réel + HTTPS/DNS/
pare-feu, puis validation URL signée Option A + Auth/Files **en réel**).

**Étape précédente — Cloud Core 8 — correction de l'image runtime API NestJS** : **corrige** le défaut bloquant CC7 (image API en
crash-loop) et **ferme l'angle mort CI** (image buildée mais jamais exécutée). **Cause** : le query engine
Prisma de `node_modules/.prisma/client` était compilé pour **OpenSSL 1.1.x** (détection `native` ambiguë au
stage build, sans openssl) alors que la base runtime est **Debian 12 bookworm / OpenSSL 3.0.x** → moteur
introuvable → crash-loop. **Correctif** : `cores/api-nestjs/prisma/schema.prisma` generator
`binaryTargets = ["native", "debian-openssl-3.0.x"]` (force l'émission du moteur 3.0.x, copié depuis
`@prisma/engines` **sans réseau**) **+** `cores/api-nestjs/Dockerfile` installe `openssl`/`ca-certificates`
**aussi au stage build**. **Re-validation réelle** (image publiée + moteur 3.0.x monté = sortie du fix ;
`STAGING_DRY_RUN_REPORT.md` §8) : **migrations depuis l'image** (`prisma migrate deploy`, **offline**, 5
appliquées), API **`Up (healthy)`** `/health/live` & `/health/ready` **200**, Web **200**, **stack staging
complète healthy**, logs « Nest application successfully started » **sans** erreur moteur. **CI** :
`.github/workflows/registry-ci.yml` nouveau job **`api-smoke`** (build → **lance l'image** → vérifie le
chargement du moteur Prisma **sans DB** : erreur de connexion = OK / « engine could not be located » = FAIL ;
+ non-root + openssl + moteur présent) → **`images` `needs: api-smoke`** ⇒ **push GHCR conditionné au smoke**.
**Stratégie migrations** tranchée = **Option A (depuis l'image)** (CLI Prisma 6.19.3 + `schema-engine-debian-
openssl-3.0.x` embarqués). **Validation locale réduite justifiée** : `docker build`/`npm ci` **bloqués** (egress
sandbox npm) → fix prouvé par (a) `prisma validate` OK, (b) dry-run réel ci-dessus, (c) `api-smoke` qui validera
en CI ; **aucune** modif de logique métier ; `cores/web-nextjs/src`/`ui-kit/src`/`packages`/`docs/adr`/`strategy`
**non modifiés** ; **aucun secret/`latest`/déploiement**. Statuts **inchangés** (Cloud Core
`IMPLEMENTATION_PARTIELLE` ; ADR-013/014 partiels) ; **déploiement staging = `DRY_RUN_API_IMAGE_FIXED`**. Commit
`fix(api): make docker runtime prisma engine compatible` **mergé via PR #7** (`d1e6242`). **CC8B (post-merge)
validé — observation réelle** : registry CI sur `main` **`api-smoke` = success** + **`images` push success** →
**images corrigées publiées** (`sha-d1e6242`/`main-d1e6242` API **et** Web, **aucun `latest`**) ; l'image API
`sha-d1e6242` **démarre par elle-même** (moteur `debian-openssl-3.0.x`, OpenSSL 3.0.20, non-root ; **dry-run
post-merge** : API/Web `healthy`, `/health/live`+`/health/ready`+`/`=200). Tags ≤ `sha-7b07e5e` restent cassés
(ne pas utiliser). **Prochaine action : Cloud Core 9 — exécution staging réelle contrôlée sur serveur.**

**Étape précédente — Cloud Core 7 — préparation serveur staging & dry-run contrôlé** (`cores/cloud/docs/STAGING_DRY_RUN_REPORT.md`) :
**dry-run local réel** exécuté à partir des **images GHCR immuables** (`sha-7b07e5e`, commit `main` `7b07e5e`) avec
un `.env.staging` **réel généré hors dépôt** (`/tmp`, `chmod 600`, secrets jetables `openssl rand -base64`,
**shred** après) — **aucun déploiement réel, aucun secret committé, aucun `latest`, aucun workflow deploy**. Type
de staging = **D (dry-run local)** (aucun serveur réel identifié). **Résultats** : ✅ `docker compose config`
valide (images résolues au **tag immuable**, **aucun `latest`**) ; ✅ images GHCR **tirées en anonyme** (registry
public) ; ✅ `postgres healthy` (`pg_isready`) + `minio Up` + **bucket** `enistere-staging-files` créé ; ✅ **image
Web boote** (hors compose : **HTTP 200**, Next 16.2.7) ; ❌ **défaut BLOQUANT** : l'**image API ne démarre pas**
(crash-loop) — le **query engine** Prisma de `node_modules/.prisma/client` est compilé pour **OpenSSL 1.1.x**
(`libquery_engine-debian-openssl-1.1.x.so.node`) alors que la **base runtime de l'image est Debian 12 bookworm /
OpenSSL 3.0.x** → moteur introuvable → `/health/ready` jamais vert. **Défaut invisible à la CI** (`api-runtime-ci`
exécute l'API **depuis les sources** sur le runner ; `registry-ci` **construit** l'image mais ne l'**exécute**
jamais). **Migrate-from-source non exercé** (egress du dry-run bloque `binaries.prisma.sh` — limite
d'environnement, pas un défaut du dépôt). **Corrections documentaires** : runbook (l'image **embarque** le CLI
Prisma 6.19.3 + `schema-engine-debian-openssl-3.0.x` → « CLI absent » **faux** → **stratégie migrations rouverte**
en CC8 : depuis l'image vs sources) ; **décision MinIO/URL signée tranchée (Option A)** : `S3_ENDPOINT` = adresse
**publique** du serveur (jamais `minio:9000`, non résolu par le navigateur), console 9001 non exposée,
`S3_PUBLIC_ENDPOINT` = évolution future hors V1. **Nettoyage** : `compose down -v` + `.env.staging` shred ;
**aucun `.env` réel dans le dépôt** (`git ls-files` : seulement `*.example`), working tree propre. **Aucune
modification** de `cores/*/src`/`packages`/`docs/adr`/`strategy` **ni des Dockerfiles/workflows** (l'image n'est
**pas** corrigée ici, par périmètre). Statuts **inchangés** (Cloud Core `IMPLEMENTATION_PARTIELLE` ; ADR-013/014
**partiels**) ; **déploiement staging = `DRY_RUN_EXECUTE`** (dry-run exécuté, **défaut bloquant** → exécution
réelle BLOQUÉE ; **ni** opérationnel **ni** automatisé). Commit `docs(cloud): prepare staging dry run` (via PR,
push direct `main` refusé). **Prochaine action : Cloud Core 8 — corriger l'image runtime API (moteur de requête
Prisma)** pour qu'elle démarre, puis re-jouer le dry-run + trancher la stratégie migrations.

**Étape précédente — Cloud Core 6 — déploiement staging manuel** (cadrage `CADRE_MANUEL_DOCUMENTE`) : **aucun déploiement réel,
aucun secret, aucune production, aucun `latest`, aucune automatisation/workflow deploy**. Livrables :
`cores/cloud/staging/docker-compose.staging.example.yml` (**api+web+postgres+minio**, réseau interne,
healthchecks node/pg_isready, **migrations hors démarrage**, PostgreSQL **non exposé**, MinIO API exposé pour
les **URL signées**), `cores/cloud/staging/.env.staging.example` (**placeholders `CHANGE_ME`**, secrets API
injectés **uniquement** dans le conteneur API — **pas** dans le Web), `cores/cloud/staging/README.md`, et les
runbooks **`STAGING_DEPLOYMENT_RUNBOOK.md`** (tag immuable `sha-*`, secrets hors dépôt `openssl rand -base64 48`,
bucket MinIO privé, **migrations Prisma découplées de l'image** — runtime sans CLI → `npx prisma migrate deploy`
depuis les sources au commit déployé —, health checks, données de test éphémères, contrainte **URL signée =
hôte `S3_ENDPOINT` joignable navigateur**, **`NEXT_PUBLIC_*` figé au build**) + **`STAGING_ROLLBACK_RUNBOOK.md`**
(**rollback d'image** simple par tag immuable ; **rollback DB NON garanti** → migrations **additives** ;
backup/restore `pg_dump`/`psql`). **Validation** : `docker compose config` **OK** (4 services), **aucun secret
API fuité dans le conteneur Web** (vérifié), `git diff --check` clean. **Cookies/TLS** documenté
(`APP_ENV=production` en HTTPS, `staging` en HTTP). Docs Cloud mises à jour (README, baseline §11,
SECRETS_POLICY §2). **`cores/*/src`/`packages`/`docs/adr`/`strategy` non modifiés** ; **aucun Dockerfile/workflow
modifié**. Statuts **inchangés** (Cloud Core `IMPLEMENTATION_PARTIELLE` ; ADR-013/014 partiels) ; déploiement
staging = **`CADRE_MANUEL_DOCUMENTE`** (pas `IMPLEMENTE_AUTOMATISE`). Commit `docs(cloud): add manual staging
deployment baseline` **mergé via PR #4** (`b001ce8` sur `main`) — **CC6B validé** : tous les checks requis
**verts** (CI/api-runtime/web-e2e/registry sur la PR **et** sur `main`), artefacts staging **intégrés à `main`**,
`docker compose config` OK, **aucun `.env` réel / secret**, et **images GHCR `main-b001ce8`/`sha-b001ce8`
publiées** (registry rejoué au merge, **aucun `latest`**). **Prochaine action : Cloud Core 7 — exécution réelle
staging** (si serveur+secrets prêts) ; **sinon dry-run / préparation serveur / durcissement registry**.

**Étape précédente — Cloud Core 5 — Registry GHCR sans déploiement** (niveau 4 partiel) : début d'**ADR-014** (registry
**uniquement**), **sans déploiement, sans staging/production, sans rollback, sans secret applicatif, sans PAT**.
**Dockerfiles** : `cores/api-nestjs/Dockerfile` (contexte `cores/api-nestjs/` — multi-stage : build = `npm ci`
+ `prisma generate` + `nest build` ; runtime = deps prod + `.prisma` copié + openssl + **`USER node`**) et
`cores/web-nextjs/Dockerfile` (contexte **racine** — build des paquets + Web ; runtime = Next.js **standalone**,
`node cores/web-nextjs/server.js`, **`USER node`**) + `.dockerignore` (API + racine ; **aucun `.env`/secret
copié**). `next.config.ts` : ajout **`output: 'standalone'`** + `outputFileTracingRoot` (racine) — **testé**,
niveau 1 **inchangé** (307 tests, typecheck/lint/build verts). **Workflow** `.github/workflows/registry-ci.yml`
(job `images`, matrice api/web) : `permissions: contents:read + packages:write` ; **PR → build SANS push** ;
**push `main` → login GHCR (`secrets.GITHUB_TOKEN`) + build + push** ; actions `docker/{setup-buildx,login,
metadata,build-push}-action` (majeure). **Images** `ghcr.io/<owner>/<repo>/{api-nestjs,web-nextjs}` (owner/repo
= `github.repository`, minuscules). **Tags immuables** (`metadata-action`, `flavor: latest=false`) :
`sha-<short>`, `main-<short>`, `pr-<n>` (build seul) — **`latest` JAMAIS généré** ; **labels OCI**. **Validation
locale** : `docker build` **API OK + Web OK** + smoke (`node --version`, exécution **non-root**, **aucun `.env`**
dans l'image) ; non-régression niveau 1 verte (307) + `npm audit` 0 vuln. **Workflows existants (1–3)
inchangés.** Docs : `REGISTRY_POLICY.md` (→ partiel), **`GHCR_REGISTRY_GUIDE.md`** (nouveau), `.github/workflows/
README.md`, baseline, `cores/cloud/README.md`. ADR-014 → **`PARTIELLEMENT_IMPLEMENTE`** ; ADR-013 partiel
(niveaux 1–4 partiel) ; Cloud Core reste `IMPLEMENTATION_PARTIELLE`. `cores/*/src`/`packages`/`docs/adr`/
`strategy` **non modifiés** (hors `next.config.ts`, config build testée). **Repo public** + **flux PR observé**
(la PR a été exigée ; protection formelle de branche ensuite documentée par Quality Core 3). Commit `ci(cloud): add ghcr registry workflow` (`cf7873c`)
**mergé via PR #1** (squash → `b41a953`), puis **Cloud Core 5B** (vérification) **mergé via PR #2** (merge commit
→ `b41a953..bfd33dc` sur `main`). **Cloud Core 5B : VALIDÉ — observation réelle effectuée** (repo **public** →
API GitHub Actions lisible + `docker manifest inspect` anonyme ; `gh` non installé mais non nécessaire) :
**Registry CI verte sur `main`** (push `b41a953` **et** `bfd33dc`, conclusion `success` → build API + build Web +
**push GHCR** réussis) ; **tous les checks requis verts** sur PR #1 et PR #2 ; **images GHCR publiques**
`ghcr.io/mike-zks/enistere-os-foundation/{api-nestjs,web-nextjs}` présentes avec tags **`main-b41a953`**,
**`main-bfd33dc`**, **`sha-bfd33dc`** ; **aucun tag `latest`** (`manifest unknown` confirmé). **Aucun déploiement/
secret/PAT/`GHCR_TOKEN`/staging ajouté** (workflow `GITHUB_TOKEN` seul). *(Observation : les workflows e2e/audit
ont eu des échecs **transitoires** sur d'anciens commits — endpoint `npm audit` indisponible / flakiness e2e —
mais tous les runs `main` récents sont verts ; flakiness à surveiller, cf. risques.)* **Prochaine action :
Cloud Core 6 — déploiement staging manuel** (ou durcissement registry) — **débloquée**. **Flux PR obligatoire**
(push direct `main` refusé).

**Étape précédente — Cloud Core 4 — durcissement CI & gouvernance de branche** (mission **documentaire**) : prépare la CI à être
**exigée** comme protection de `main`, **sans** déploiement/registry/secret, **sans** modifier les workflows
existants ni **renommer aucun job**. **7 checks** figés à rendre bloquants sur `main` (= `name:` des jobs :
`api-contracts`/`api-client-fetch`/`ui-kit`/`web-nextjs`/`audit` de `ci.yml` + `api-runtime` de
`api-runtime-ci.yml` + `web-e2e` de `web-e2e-ci.yml`). `GITHUB_BRANCH_PROTECTION_CHECKLIST.md` enrichi : matrice
des checks (obligatoires-maintenant vs futurs), avertissement « **renommer un job casse l'exigence** »,
vérifications post-application. **Politiques tranchées** (`CLOUD_CORE_V1_EXECUTION_BASELINE.md` §8 bis) :
**artefacts** = **aucun upload** (Option A ; traces Playwright `retain-on-failure` locales, jetées ; Option B
upload-`if:failure()` rétention courte sans logs/`.state.json`/cookies/URL signée = future) ; **couverture** =
**exécutée, non publiée** (UI Kit 100 %, Web ≈ 87,8 % ; aucun Codecov/gate) ; **pinning** = `@v4` conservé (SHA
= durcissement futur avec politique de MAJ) ; **`actionlint`** = futur (non installé ; validation = parse YAML +
simulations CC2/CC3). Docs mis à jour : `.github/workflows/README.md` (checks requis + politiques),
`API_RUNTIME_CI_PLAN.md`/`WEB_E2E_CI_PLAN.md` (check requis), `cores/cloud/README.md`. **Validation réduite
justifiée** (doc-only) : web `check` (**307** tests) + `npm audit` **0 vuln** + parse YAML des 3 workflows +
`git diff --check`. **Workflows existants intacts** (`ci.yml`/`api-runtime-ci.yml`/`web-e2e-ci.yml` non
modifiés). Cloud Core **reste** `IMPLEMENTATION_PARTIELLE` ; ADR-013 **partiel** (niveaux 1–3 + protection de
branche **documentée non appliquée**) ; ADR-014 **`NON_IMPLEMENTE`**. `cores/*/src`/`packages`/`docs/adr`/
`strategy` **non modifiés**. Commit `docs(cloud): harden ci governance`. **Prochaine action (humaine)** :
appliquer la protection de branche `main` ; **prochaine mission** : **Cloud Core 5 — Registry GHCR sans
déploiement**. **Note actuelle** : depuis Governance 3, la protection `main` est active via GitHub Rulesets.

**Étape précédente — Cloud Core 3 — CI E2E navigateur (niveau 3)** (`.github/workflows/web-e2e-ci.yml` + `cores/web-nextjs/e2e/`) :
implémente le **niveau 3** — un workflow démarrant une **stack réelle et éphémère** (PostgreSQL `services:` +
MinIO `docker run` + **API NestJS** + **Web Next.js**) et rejouant les **parcours navigateur** critiques avec
**Playwright/Chromium** headless, **sans déploiement, registry/GHCR, Dockerfile applicatif, secret GitHub ni
environnement protégé**. **Outil** : `@playwright/test` (devDep du **workspace Web**) + Chromium
(`playwright install --with-deps chromium`) — pas de Cypress/Storybook. **Isolation niveau 1** : `e2e/` +
`playwright.config.ts` **exclus** de `typecheck`/`lint`/`build` (`tsconfig.json` `exclude` + `eslint.config.mjs`
`ignores`) → niveau 1 **inchangé** (vérifié : 307 tests Web, typecheck/lint/build verts). **Orchestration** :
`npm ci` + build paquets → `e2e:install` (Chromium) → API (autonome : `npm ci`, prisma generate/migrate:deploy/
seed, build, démarrage + attente `/health/ready`) → **seed utilisateurs** éphémères (`proof-seed-user.ts` →
propriétaire + sans-permission via `$GITHUB_ENV`) → build + démarrage Web (`next start`, **`APP_ENV=development`**
pour cookies HTTP) → **`playwright test`**. **Fixture** : `e2e/global-setup.ts` téléverse un **fichier VALIDATED**
éphémère via l'API → `e2e/.state.json` (gitignoré) ; **aucun token/URL signée journalisé**. **Specs**
(`e2e/{health,auth,files}.spec.ts`) : **Health** (accueil + sans fuite de config), **Auth** (anonyme `/protected`
→ `/login` ; identifiants invalides → **erreur générique** sans énumération, reste sur `/login` ; login valide
→ `/protected` ; **déconnexion** → re-navigation → `/login`), **Files** (métadonnées publiques, titre = nom
d'origine, **aucun champ interne** storageKey/bucket/checksum/ownerId, **téléchargement** : `download-url` **200**
+ requête au stockage ; id inexistant → « Fichier introuvable » ; sans permission → « Accès refusé »).
**Valeurs de test jetables** (jamais `secrets.*`, jamais en `.env`), traces `retain-on-failure`, **aucun
artefact poussé**. **`ci.yml`/`api-runtime-ci.yml` inchangés.** **Validation** : non-régression niveau 1
**12/12** (avec e2e présent) + **simulation locale du workflow** (stack réelle + Chromium) → **7 tests Playwright
verts** (anonyme→/login, invalide→erreur, login+logout, métadonnées+téléchargement, introuvable, accès refusé,
Health). Cloud Core **reste** `IMPLEMENTATION_PARTIELLE` (trois workflows CI niveaux 1–3 ; **pas** de registry/
déploiement/environnements/monitoring/rollback). ADR-013 **partiel** (niveaux 1–3) ; **ADR-014 `NON_IMPLEMENTE`**.
`cores/web-nextjs/src`/`ui-kit/src`/`packages`/`docs/adr`/`strategy` **non modifiés** (hors `tsconfig`/`eslint`/
`.gitignore`/`package.json` du Web pour isoler l'E2E). Commit `ci(web): add browser e2e validation workflow`.
**Prochaine action : Cloud Core 4 — durcissement CI & protection de branche** (humain).

**Étape précédente — Cloud Core 2 — CI runtime API NestJS (niveau 2)** (`.github/workflows/api-runtime-ci.yml`) : implémente le
**niveau 2** de la politique CI cadrée — un workflow rejouant l'**API Core NestJS** contre ses dépendances
runtime **jetables**, **sans déploiement, registry/GHCR, Dockerfile applicatif, secret GitHub ni environnement
protégé**. `cores/api-nestjs/` est un projet npm **autonome** (lockfile propre, **hors workspaces racine**) →
`working-directory: cores/api-nestjs` + **`npm ci`** ; Node 24 ; `permissions: contents: read` ; concurrence ;
**pas de `pull_request_target`**. **Services** : **PostgreSQL** (`postgres:16`, conteneur `services:`,
healthcheck `pg_isready`) ; **MinIO** (`minio/minio` via **`docker run`** — un `services:` **ne peut pas**
porter la commande `server /data` requise — + attente santé + **bucket `enistere-test-files`** créé via
`@aws-sdk/client-s3`, l'API ne le créant pas). **Variables = valeurs de test jetables** définies dans le
workflow (jamais `secrets.*`, jamais en `.env` versionné ; noms alignés sur `.env.example` : `DATABASE_URL`,
`JWT_*`, `REFRESH_TOKEN_HASH_SECRET`, `ARGON2_*`, `S3_*`, rate limits élargis, `LOG_LEVEL=warn`). **Étapes**
(scripts **réels** de `cores/api-nestjs/package.json`) : `prisma:generate` → `prisma:validate` →
**`prisma:migrate:deploy`** (migrations sur base jetable) → `lint` → **`npm test`** (unitaires) →
**`test:e2e`** (PostgreSQL + MinIO réels) → **`openapi:check`** (snapshot canonique) → `build` (nest build) →
`npm audit`. *(Pas de script `typecheck` côté API ; `nest build` couvre la compilation.)* **Aucun artefact
uploadé**, **logs sans secret**, données **éphémères**. **`ci.yml` (niveau 1) inchangé.** **Validation** :
baseline no-service locale (prisma:generate/validate, lint, build, `npm audit` 0 vuln) + **simulation locale
du workflow** (mêmes services `postgres:16`/`minio`, même env, mêmes étapes : migrate deploy + unit + **e2e** +
openapi:check + build) ; **`npm ci` API validé séparément** (exit 0, 802 paquets, 0 vuln, ~3 min). **Non-
régression monorepo** (niveau 1) **verte** (contracts 11, client 29, ui-kit 78, web 307+build, audit 0 vuln).
Cloud Core → **`IMPLEMENTATION_PARTIELLE`** ; ADR-013 **partiel** (niveaux 1–2) ; **ADR-014 `NON_IMPLEMENTE`**.
`cores/web-nextjs/src`/`ui-kit/src`/`packages`/`docs/adr`/`strategy` **non modifiés** ; logique applicative API
**non modifiée**. Docs Cloud + checkpoint mis à jour. Commit `ci(api): add runtime validation workflow`.
**Prochaine action : Cloud Core 3 — E2E navigateur (niveau 3)** + protection de branche (manuel).

**Étape précédente — Cloud Core 1 — cadrage minimal d'exécution CI/CD & environnements** (`cores/cloud/`) : transforme la CI
minimale en **socle gouverné**, **sans déploiement, Docker, registry, secret ni infra réelle**. Documents
créés (`cores/cloud/docs/`) : **`CLOUD_CORE_V1_EXECUTION_BASELINE.md`** (17 sections : objectif, état,
environnements, politiques CI/secrets/registry/runtime/E2E/observabilité/rollback, limites, étapes) ;
**`GITHUB_BRANCH_PROTECTION_CHECKLIST.md`** (application **manuelle** : PR obligatoire, **5 checks CI
bloquants**, force-push/suppression interdits, linear history à décider, CODEOWNERS plus tard) ;
**`SECRETS_POLICY.md`** (aucun secret en Git/CI ; **noms futurs sans valeurs** ; jamais en `NEXT_PUBLIC_*` ;
GitHub Environments futurs ; procédure d'exposition) ; **`REGISTRY_POLICY.md`** (GHCR cible, tags **immuables**
sha court, pas de `latest` prod — **ADR-014 `NON_IMPLEMENTE`**) ; **`API_RUNTIME_CI_PLAN.md`** (niveau 2 futur :
PostgreSQL/MinIO en services, prisma migrate, unit+e2e, openapi:check, logs sans secret) ;
**`WEB_E2E_CI_PLAN.md`** (niveau 3 futur : Playwright à décider, parcours Health/Auth/Files, données
éphémères). **`cores/cloud/README.md`** créé ; `.github/workflows/README.md` enrichi (politique CI 4 niveaux).
**Environnements logiques** : `local`/`ci` (réels) + `preview`/`staging`/`production` (théoriques). **Politique
CI à 4 niveaux** : 1=présent, 2=runtime API, 3=E2E Web, 4=registry/déploiement. **Non-régression** : baseline
locale **14/14** (contracts 11, client 29, ui-kit 78, web 307+build, audit 0 vuln) — **aucun code/CI modifié**.
Cloud Core → **`CADRAGE_OPERATIONNEL`** (non augmenté en `IMPLEMENTATION_PARTIELLE`) ; ADR-013 reste
**partiel**, ADR-014 **non implémenté**. `cores/api-nestjs/src`/`web-nextjs/src`/`ui-kit/src`/`packages`/
`docs/adr`/`strategy` **non modifiés** ; `ci.yml` **non modifié**. Commit `docs(cloud): define v1 execution
baseline`. **Prochaine action : Cloud Core 2 — CI runtime API (niveau 2)** + protection de branche (manuel).

**Étape précédente — CI minimale (ADR-013)** (`.github/workflows/ci.yml`) : première implémentation réelle d'ADR-013 — CI GitHub
Actions de **non-régression du monorepo**, **sans déploiement, registry, Docker, secret ni publication**.
Déclencheurs `pull_request` + `push` sur `main` ; `permissions: contents: read` ; `concurrency` (annule
l'obsolète) ; **Node 24** + **`npm ci`** (jamais `npm install`) + `cache: npm`. **5 jobs ordonnés par `needs`**
(échec lisible) imposant l'ordre de build : **`api-contracts`** (`generate:check` + typecheck/build/test) →
**`api-client-fetch`** (build de la dépendance api-contracts puis typecheck/build/test) → **`ui-kit`**
(`tokens:check`/typecheck/build/lint/test/`pack:check`) → **`web-nextjs`** (build des 3 dépendances puis
typecheck/lint/test/**build sans API**) → **`audit`** (`npm audit` 0 vuln + **gardes Axios/Zustand absents**
ADR-011/012 + versions clés react/react-query/next). Chaque job aval **rebuild ses dépendances** (`dist/` non
versionnés) — **validé par simulation runner neuf** (dist effacés → chaîne reconstruite → verte). **Pas de
`pull_request_target`, aucun secret, aucun Docker/PostgreSQL/MinIO, aucun GHCR, aucun déploiement.**
Non-régression locale (Node 24.14, `npm ci`) **verte** : api-contracts 11, api-client-fetch 29, ui-kit 78
(+tokens/pack), web-nextjs 307 + build, **`npm audit` 0 vuln**, Axios/Zustand absents. **Corrections** : aucune
au code applicatif ; aucun script modifié. ADR-013 → **`PARTIELLEMENT_IMPLEMENTE`** ; ADR-014 **non
implémenté**. Docs : `.github/workflows/README.md` + checkpoint. `cores/api-nestjs/src/`/`mobile`/`cloud`/
`docs/adr`/`strategy` **non modifiés**. Commit `ci: add minimal monorepo validation`. **Prochaine action :
Cloud Core 1 — cadrage CI/CD & environnements.**

**Étape précédente — Revue globale Web Core — incrément V1** (`@enistere/web-nextjs`) : revue **transverse de stabilisation** de
l'incrément complet (Health public + Auth 1→5 + UI 1 + Files 1) traité comme **un système unique**, **sans
nouvelle fonctionnalité**. Vérifié fichier par fichier + commandes + runtime : architecture (couches
`app→features→core/shared`, **aucun import inversé**, 16 client components justifiés, aucun barrel dangereux),
14 routes (privées/BFF `ƒ` → **build indépendant de l'API**), 6 clients API à responsabilités disjointes (aucun
Bearer/token côté navigateur), **BFF ciblé** (jamais proxy générique ; UUID 400 sans appel API ; CSRF/Origin
fail-closed avant API ; `no-store`), configuration (URL validée, `server-config` serveur-only, origines
exactes), **frontières client/serveur** (test statique : `next/headers`/server-config/handlers/http Files
interdits côté client), TanStack Query (client navigateur stable / serveur par rendu, **clés disjointes**,
**retry borné Health vs `retry:false` Auth/Files** documenté, **URL signée = mutation jamais en cache**),
contrats `SchemaOf<>` (`generate:check` ok, aucun DTO recopié, décisions sur status/errorCode jamais message),
a11y (un `h1`/page, jest-axe sur les vues clés), erreurs Files distinctes (**400/401/403/404/409/429/503/502/
504**). **Scans** : aucun token/URL signée/donnée privée en source, logs, `.next/static`, RSC. **Non-régression** :
Web **307 tests ×2** (10,1 s/9,9 s, sans hang) + couverture **≈ 87,8 %** (modules `files/` 96–100 %) + build ;
UI Kit 78 (100 %) + pack:check ; api-contracts 11 ; api-client-fetch 29 ; **0 vuln** ; Axios/Zustand absents.
**Preuve runtime réelle (PostgreSQL + MinIO jetables) 49/49** (parcours critique Auth+Files **rejoué ×2**) :
public (home 200 API up **et** down) ; Auth (anonyme→/login, login, /protected 200, /me sans token, refresh
rotation, logout→401+/login) ; Files (métadonnées 200 sans champ interne, download-url 200 {url,expiresAt},
**téléchargement réel MinIO** octets==upload image/png, **signature altérée→403**, **URL réellement expirée
(TTL 30 s)→403**) ; droits (sans files.read→403, non-propriétaire+permission→**404**, **révocation sans nouveau
JWT**→403, quarantaine→409, objet absent→503) ; **pannes** (MinIO arrêté→503 ; API arrêtée→home 200 +
/protected « indisponible » **sans contenu privé ni donnée utilisateur** + /api/files→502) ; concurrence
(double login, double download-url 200/200, isolation deux cookie jars). **Verdict :
`WEB_CORE_V1_INCREMENT_STABLE_WITH_RESERVATIONS`** (aucun défaut bloquant ; réserves : **CI + ordre de build**,
E2E navigateur ; mineures : CSP/HSTS, 429, contrastes, cache Files au logout). **Corrections documentaires
seules** (zéro comportement) : `.env.example` (+`WEB_ALLOWED_ORIGINS`), `SECURITY.md` (routes protégées
implémentées + posture Files). Statut Web Core **maintenu** `IMPLEMENTATION_PARTIELLE`. Rapport permanent :
`cores/web-nextjs/docs/WEB_CORE_V1_INCREMENT_REVIEW.md`. `packages/`/`api-nestjs/`/`ui-kit` **non modifiés**.
Commit `docs(web-nextjs): review web core v1 increment`. **Prochaine action : CI minimale (ADR-013).**

**Étape précédente — Web Core Files 1 — métadonnées & téléchargement sécurisé (lecture seule)** (`@enistere/web-nextjs`) :
première intégration **Files** du Web Core, **sans upload/suppression/admin**. Statut **inchangé**
`IMPLEMENTATION_PARTIELLE`. **BFF ciblé** (jamais un proxy générique) : `GET /api/files/:id` (métadonnées
**publiques**, client serveur **read-only** sans refresh au rendu, `no-store`) et `POST /api/files/:id/download-url`
(URL signée courte, client serveur **writable** réutilisant le refresh BFF existant, **Origin/Referer + CSRF**,
`no-store`). Ordre de garde : méthode (405) → **validation UUID** (400 **sans appel API**) → [POST : CSRF/Origin
403] → API ; seul l'**UUID** du chemin est accepté (jamais URL/bucket/storageKey/TTL/headers). Mapping d'erreurs
**distinct** (`core/files/http/files-response.ts`) préservant **404 anti-énumération** / **409** (non
téléchargeable) / **503** (stockage indisponible). **Client BFF navigateur** (`credentials:"include"`, **aucun
Bearer**, ne lit aucun token). **TanStack Query** : `fileKeys.all/detail(id)` **disjoints** de auth/health
(UUID admis, **jamais** d'URL/token) ; `useFileMetadata` (query : `enabled` si UUID, `retry:false`,
`PublicStoredFileDto`) ; **`useCreateDownloadUrl`** = **mutation** (sans `mutationKey`) dont l'URL signée est
**consommée immédiatement** (`triggerDownload`) puis **abandonnée** — **jamais** en cache/log/persistance ;
anti-double-clic. **Téléchargement** : URL `https`-only validée (`isSafeDownloadUrl` ; `javascript:`/`data:`
refusés ; signature jamais reconstruite) → **ancre temporaire** `rel="noopener noreferrer"`. Formatage **pur**
(`formatFileSize` BigInt, `formatDateTime` UTC déterministe). Page privée `/protected/files/[id]` → `FileDetails`
(hooks inconditionnels puis branche) avec états réutilisés **`LoadingState`/`EmptyState`(404)/`ForbiddenState`(403)/
`ServiceUnavailableState`(503)/`ErrorState`**, succès `PageHeader`+`Card`. **L'API reste l'autorité**
(`files.read`/`files.download` + ownership → **404** anti-énumération pour un non-propriétaire) ; `useAuthorization`
ne sert qu'à l'affichage du bouton. **Aucun champ interne** (storageKey/bucket/checksum/ownerId), `originalName`
rendu en **texte**. **307 tests** Web (+37) + **preuve API + MinIO réelle 21/21** (PostgreSQL + MinIO jetables) :
upload (auto-VALIDATED + objet) → propriétaire `GET` **200** (publics, no-store, aucun champ interne) →
`download-url` **200** `{url,expiresAt}` → **téléchargement réel MinIO** (octets == upload, `Content-Type`
image/png) → sans permission **403** → **non-propriétaire (avec permission) → 404** → quarantaine **409** → objet
supprimé **503** → logout **401** + page → `/login` ; **aucun** `storageKey`/`bucket`/`X-Amz-Signature`/credentials
en métadonnées, logs ou bundle. **Non-régression** : Web 307 + couverture + build ; UI Kit 78 ; api-contracts 11 ;
api-client-fetch 29 ; **0 vuln** ; Axios/Zustand absents. **Aucun nouveau composant UI Kit, aucun middleware,
aucun proxy.** API NestJS / `packages/` / `ui-kit` **non modifiés**. Docs : `cores/web-nextjs/docs/files-read-download.md`
(+ `api-integration.md`/`tanstack-query.md`). Commit `feat(web-nextjs): add secure file read access`.

**Étape précédente — Web Core UI 1 — états UI & composants structurels génériques** (`@enistere/ui-kit` + `@enistere/web-nextjs`) :
standardise les états d'interface et ajoute 3 primitives structurelles. Statuts **inchangés**
`IMPLEMENTATION_PARTIELLE`. **UI Kit** : `Alert` (variant info/success/warning/danger ; rôle status sauf
danger→alert ; glyphe+bordure+titre, jamais couleur seule), `Card` (slots ; `CardTitle` n'impose aucun
niveau), `FormField` (composition **explicite**, aucune injection magique) — CSS **tokens-only** (aucun hex),
`styles.css` régénéré, socle UI Kit désormais **121 tests** (+ jest-axe après UI Kit 4), `pack:check` OK. **Web Core** (`src/shared/components/`) :
`LoadingState`, `EmptyState`, `ErrorState` (+`requestId`), **`UnauthorizedState`(401) ≠ `ForbiddenState`(403,
permission non révélée)**, `ServiceUnavailableState` (≠ session anonyme), `PageHeader` (h1 par défaut) — chacun
`inline?`, **aucune donnée sensible**. **Intégrations** : `PageHeader` + galerie `StatesShowcase` (accueil),
`EmptyState` (Health non configuré), `ErrorState`/`NotFoundState`/`LoadingState` (frontières),
`service-unavailable-view` **délègue** à `ServiceUnavailableState` (dé-duplication ; flux Auth inchangés).
**270 tests** Web (+40). Non-régression : UI Kit (tokens/typecheck/build/lint/test/coverage 100 %/pack) ; Web
check+couverture+build ; packages 11+29 ; **0 vuln** ; Axios/Zustand absents. **Aucun framework UI lourd
(Tailwind/Radix/shadcn) ajouté.** Docs : `cores/ui-kit/docs/components.md`, `cores/web-nextjs/docs/ui-states.md`.
Commit `feat(web-ui): add standard interface states`.

**Étape précédente — Revue globale Auth Web (1 → 5)** (`@enistere/web-nextjs`) : revue **transverse de stabilisation** du socle
Auth traité comme **un système unique** — **sans nouvelle fonctionnalité**. Vérifié **fichier par fichier** +
commandes : architecture (BFF + résolution serveur + login), 6 routes BFF + `/protected` + `/login` (`ƒ`),
cookies `HttpOnly`/`__Host-`, CSRF + Origin/Referer (fail-closed), **aucune fuite de token** (greps src + bundle
`.next/static` : tous secrets absents), session (401→anonymous / 403·5xx·réseau distincts), caches disjoints +
purge login/logout, résolution serveur read-only (aucun contenu privé avant validation), `returnTo`
**anti-open-redirect**, RBAC OR/AND sans wildcard, contrats `SchemaOf<>` (`generate:check` ok), mappeurs d'erreurs
cohérents, frontières d'import (test statique). **Non-régression** : web `check` (typecheck+lint+**263 tests
×2 sans hang**+build) + couverture ≈ 86,1 % ; UI Kit 64 ; api-contracts 11 ; api-client-fetch 29 ; **0 vuln**.
**Preuve runtime rejouée (un système unique) 33/33** (NestJS + PostgreSQL jetable) : nominal (anonyme→/login→
login→/protected hydraté→/authorization) + **refresh** (rotation, `/me` read-only sans refresh) + **droits sans
nouveau JWT** + erreurs (401 sans énumération, 403 CSRF, 403 Origin) + API down (« indisponible » ≠ anonyme) +
bundle sans secret. **Verdict : `AUTH_WEB_V1_STABLE_WITH_RESERVATIONS`** (aucun défaut bloquant ; réserves
opérationnelles : CI, E2E navigateur, streaming-redirect, multi-onglets, CSP/HSTS). **Aucune correction de code
applicatif** ; statut Web Core **maintenu** `IMPLEMENTATION_PARTIELLE`. Rapport permanent :
`cores/web-nextjs/docs/WEB_AUTH_V1_REVIEW.md`. `packages/`/`api-nestjs/` non modifiés. Commit
`docs(web-nextjs): review web auth v1`.

**Étape précédente — Web Auth 5 — page de connexion & navigation Auth contrôlée** (`@enistere/web-nextjs`) : page **publique
`/login`** (Server Component `force-dynamic`) — **assainit** `returnTo` (`core/auth/return-to.ts` :
`sanitizeReturnTo`/`buildLoginRedirect`, **anti open-redirect**, testable), **résout la session côté serveur**
(déjà authentifié ⇒ **redirige** vers `returnTo`, jamais de formulaire ; anonyme ⇒ formulaire ; unavailable ⇒
formulaire + état dégradé). **Login BFF** (`core/auth/client/login-client.ts` : CSRF → `POST /api/auth/login`,
same-origin, **aucun token lu**). `features/auth` : `login-validation` (UX, mot de passe non modifié),
`login-error` (génériques, **401 sans énumération**), `use-login` (`useMutation` **sans `mutationKey`**, purge
`authKeys`, **anti-double-soumission** `useRef`), `login-form` (a11y : labels/`aria`/`autoComplete`, `jest-axe`).
**App** : `app/login/page.tsx` + `login-panel.tsx` (wiring router, exclu node:test : `router.replace(returnTo)`
+ `refresh()`). Redirection anonyme du layout protégé → `/login?returnTo=/protected`. **263 tests** (+33) +
**preuve API réelle 22/22** (anonyme `/protected`→redirection `/login` ; `/login`→formulaire ; login BFF→
`authenticated` sans token ; authentifié `/protected`→200+profil hydraté, X-Request-Id propagé ; authentifié
`/login`→redirection hors login ; **`returnTo` externe→`/protected`, aucun open redirect** ; logout→`/login` ;
401 sans énumération ; 403 CSRF ; bundle/HTML sans secret/mot de passe). **Sans middleware, sans Server Action.**
**0 vuln**, Axios/Zustand absents. API NestJS / packages **non modifiés**. Détail :
`cores/web-nextjs/docs/login-flow.md`. Commit `feat(web-nextjs): add secure login experience`.

**Étape précédente — Web Auth 4 — résolution Auth serveur + premier layout protégé** (`@enistere/web-nextjs`) : premier
**espace privé** dont la session est **résolue côté serveur** (lecture seule) puis **hydratée**. Modules
**testables** : `core/auth/resolve-server-session.ts` (`resolveServerSession` → client serveur authentifié
`read-only`, `enableRefresh:false`, appel **direct** API `/auth/me`, contrat **sans token** `authenticated|
anonymous|unavailable` ; `401`→anonymous, `403`/réseau/`5xx`/réponse invalide→unavailable ; `decideProtectedRender`),
`core/auth/read-only-cookie-store.ts` (`ReadOnlyServerCookieStore` get-only + `guardReadOnly` qui **lève** sur
écriture), `core/auth/request-id.ts` (`resolveRequestId` partagé), `features/auth/auth-queries.ts`
(`prefillSessionQuery`). **Server-only** (exclu node:test) : `core/auth/server/protected-session.ts`
(`resolveNextServerSession` via `next/headers`). **App** : `app/(protected)/layout.tsx` (Server Component,
`force-dynamic` : redirect anonyme `/?auth=required` / `ServiceUnavailableView` / hydrate+children),
`(protected)/protected/page.tsx` (`/protected`), `(protected)/error.tsx`. **230 tests** (+24) +
**preuve API réelle 26/26** (anonyme→redirection serveur sans donnée privée ; authentifié→200+profil hydraté,
aucun token HTML/RSC, X-Request-Id propagé ; cookie access retiré→redirection **sans** `/auth/refresh` ;
logout→redirection ; **API arrêtée→« Service indisponible »** ≠ anonyme ; bundle sans secret). Note : sous le
**streaming** App Router, `redirect()` est délivré en HTTP 200 (RSC `NEXT_REDIRECT` + meta-refresh) — honoré
par le navigateur, **aucune donnée privée** exposée. **0 vuln**, Axios/Zustand absents, React 19.2.7. API
NestJS / packages **non modifiés**. Détail : `cores/web-nextjs/docs/protected-routes.md`. Commit
`feat(web-nextjs): add server-resolved protected layout`.

**Étape précédente — Checkpoint de gouvernance Web Core** (revue de socle — `@enistere/web-nextjs`) : mission de
**revue/vérification/consolidation/arbitrage**, **sans** implémentation fonctionnelle (aucun
middleware/page login/route protégée). Vérifié **fichier par fichier** + commandes réelles : frontières
client/serveur, 6 routes BFF `ƒ`, 3 clients API séparés, cookies `HttpOnly`/`__Host-`, CSRF + Origin/Referer,
**aucune fuite de token** (greps + bundle `.next/static`), caches `authKeys`/`healthKeys` disjoints, RBAC
OR/AND **sans wildcard**, types `SchemaOf<>` (`generate:check` up-to-date), **read-only ⇒ aucun refresh
silencieux**. **Non-régression verte** : web `check` (typecheck+lint+**206 tests ×2 sans hang**+build) +
couverture ≈ 84,7 % ; UI Kit 64 ; api-contracts 11 ; api-client-fetch 29 ; **0 vuln** ; Axios/Zustand
absents. **Décisions** : SSR Auth = **hybride** (Option C serveur read-only pour le privé / Option A
client-only pour le public) — **pas de nouvel ADR** (couvert par ADR-004/005/012) ; middleware = UX léger
**non autoritaire**. **Dette IMPORTANTE non bloquante** : ordre de build monorepo (`packages/*/dist` non
versionnés ; aucune CI — ADR-013). **Corrections documentaires/factuelles + 1 export mort** (zéro
comportement) : `package.json`, `cookie-config.ts` (CSRF actif ; `CSRF_HEADER_NAME` supprimé),
`query-client.ts`, `README.md`, `docs/SECURITY.md`, `docs/ARCHITECTURE.md`. **Rapport permanent** :
`cores/web-nextjs/docs/WEB_CORE_GOVERNANCE_REVIEW.md`. Statut **inchangé** `IMPLEMENTATION_PARTIELLE`.
`packages/` et autres cores **non modifiés**. Commit `docs(web-nextjs): review web core governance`.

**Étape précédente — Web Auth 3 — profil, autorisations et état de session avec TanStack Query** (`@enistere/web-nextjs`) :
Route Handlers `GET /api/auth/me` + `GET /api/auth/authorization` (thin, `force-dynamic`) → handlers
testables (`core/auth/handlers/get-profile`, `get-authorization`, `(Request, deps)→Response`) appelant le
client serveur **read-only** (`enableRefresh:false` → **aucun refresh silencieux** sur une lecture ; 401
propagé), `no-store`, erreurs génériques. **Client BFF navigateur** (`core/auth/client/`) : appels
**same-origin** `/api/auth/*`, `credentials:"include"`, **aucun token lu/exposé**, valide l'enveloppe
`{success,data}`, lève `BffAuthError` (http/network/invalid_response). **TanStack Query** : `authKeys`
(disjoints de `healthKeys`), `sessionQueryOptions`/`authorizationQueryOptions` (`retry:false`, sans
persistance). **`useSession`** : `loading` → `authenticated` → **`anonymous` (401, pas une erreur)** /
**`error` (403/5xx/réseau, 403 distinct d'anonyme)** ; `toPublicAuthError` (générique, sans cause/token).
**`useAuthorization`** : activé **uniquement** si authentifié (aucun appel `/authorization` en anonyme),
helpers `hasRole`/`hasAnyRole`/`hasPermission`/`hasAllPermissions` (**OR/AND, sans wildcard**, ADR-006 ;
affichage conditionnel — **API = autorité finale**). **`useLogout`** : CSRF → `POST /api/auth/logout` →
`removeQueries(authKeys.all)` (**Auth purgé, Health conservé**) ; **échec réseau → pas de purge** (retry).
UI présentationnelle (SessionStatus/AuthorizationStatus + a11y). **206 tests** + **preuve API réelle Auth +
session** (NestJS + PostgreSQL : login → `/me` (profil, **aucun token**, `X-Request-Id`, `no-store`) →
`/authorization` (rôles/permissions) → logout → `/me` **401** ; **read-only sans appel `/auth/refresh`** ;
**changement de droits sans nouveau JWT** : retrait de rôle → `roles:[],permissions:[]` sur la même session,
`/me` toujours 200 ; bundle client **sans** `API_INTERNAL_URL` ni secret). **0 vuln**, Axios/Zustand absents,
React 19.2.7 ; non-régression complète ; API NestJS/packages non modifiés. Commit
`feat(web-nextjs): add session and authorization state`.

## 9. Prochaine étape

**Décision roadmap (revue stratégique 2026-06-11 — [`ROADMAP_ALIGNMENT_REVIEW.md`](./ROADMAP_ALIGNMENT_REVIEW.md))** :
**Cloud Core mis en PAUSE contrôlée** après CC1–9 (CI + GHCR + staging local) ; **Cloud Core 10** (serveur réel)
**reporté** jusqu'à disponibilité d'un serveur + HTTPS/DNS/pare-feu (dépendance **externe**, hors socle). **Retour
aux priorités V1 de la roadmap** (§7.2/§30) : **Mobile Core React Native** était la priorité #2 V1.

**✅ Mobile Core RN 1 (starter, PR #11 mergé) + Mobile Core RN 2 — auth/session hardening : RÉALISÉS.**
`mobile-react-native` → **`AUTH_SESSION_HARDENED`**. RN 2 : **AuthEngine** framework-agnostique (restore/signIn/
signOut/refresh/clear, **refresh coalescé**, **expiration** proactive+réactive) abonné par `AuthProvider`
(`useSyncExternalStore`) ; états `loading`/`authenticated`/`unauthenticated`/`refreshing`/`expired` ; **SessionStore**
SecureStore + **validation** (access token **en mémoire** ADR-015) ; **API client `401` → refresh → 1 retry**
ADR-011 ; gardes `expired`/`refreshing` ; seam `@enistere/api-client-fetch` ADR-016 (`AuthApi`/`PlaceholderAuthApi`).
**21 tests `node --test`**. **typecheck + lint + test 21/21 + expo-doctor 19/19 verts** ; **aucune logique métier**.
Cloud Core reste **PAUSE_CONTROLEE**, staging **EXECUTION_LOCALE_CONTROLEE** ; aucun autre core démarré.

**✅ Web Core Files 3 (suppression) : RÉALISÉ** (`web-nextjs` → **357 tests**, 2026-07-09). BFF ciblé `DELETE /api/files/:id` — `assertDelete` (405), UUID 400 avant appel API, CSRF/Origin 403 avant appel API, client `writable`, 409→`NOT_DELETABLE`, anti-énumération 404. Client BFF `deleteFile` (same-origin, aucun Bearer). Mutation `useDeleteFile` (anti-double-soumission, `removeQueries` après succès). Dialog confirmation UI Kit 4 + prop `onDeleteSuccess` + `FileDetailsWithNav` (navigation Next.js isolée, exclue du tsconfig.test.json). Fix `createMockFetch` (status 204/304 → `null` body). typecheck/lint/test **357/357**/build/audit verts. Branche `feature/web-files-3-delete`.

**✅ Quality Core CI-required checks alignment : RÉALISÉ** (2026-07-12) :
rapport `docs/project-status/QUALITY_CORE_REQUIRED_CHECKS_ALIGNMENT.md`. Vérification du ruleset réel
`protect-main` : 8 checks requis (`api-client-fetch`, `api-contracts`, `api-runtime`, `ui-kit`, `web-e2e`,
`web-nextjs`, `audit`, `api-smoke`). Vérification Registry CI PR #106 : `api-smoke` + les deux jobs
`images (...)` verts. Décision : **PROMOTION_RECOMMANDÉE, NON_APPLIQUÉE** — les deux jobs `images (...)`
peuvent devenir requis si action humaine/admin, mais aucun ruleset n'est modifié par Quality Core.

**Action unique suivante** : Quality Core coverage standardization decision — décider si les scopes sans
coverage standardisée doivent recevoir une commande coverage locale ou si le baseline reste informatif.

**✅ Quality Core coverage standardization decision : RÉALISÉ** (2026-07-12) :
rapport `docs/project-status/QUALITY_CORE_COVERAGE_STANDARDIZATION_DECISION.md`. Correction du baseline :
`@enistere/ui-kit` expose déjà `test:coverage`; `quality-report.mjs` reconnaît maintenant UI Kit/Web/API
comme scopes avec coverage locale disponible (**3/8**). Décision :
**STANDARDISATION_PARTIELLE_EXISTANTE, PAS_DE_NOUVELLE_COMMANDE** — aucun workflow, dépendance, seuil,
artefact ou dashboard ajouté.

**Action unique suivante** : Quality Core V1 Readiness Review — vérifier si Quality Core peut passer de
`IMPLEMENTATION_AVANCEE` à `VALIDE_V1`.

**✅ Quality Core V1 Readiness Review : RÉALISÉ** (2026-07-13) :
rapport `docs/project-status/QUALITY_CORE_V1_READINESS_REVIEW.md`. Quality Core passe de
**`IMPLEMENTATION_AVANCEE`** à **`VALIDE_V1`**. Justification : critères roadmap §13.4 7/7, scripts
`quality-gates`/`release-helper`/`quality-report` testés, release process appliqué, prompts versionnés,
ruleset `protect-main` actif, reporting coverage local et décisions résiduelles tranchées. Réserves
non bloquantes : coverage publiée, dashboards qualité, workflows avancés, ADR-019→022.

**✅ Mobile Core V1 Readiness Review : RÉALISÉ** (2026-07-13) :
rapport `docs/project-status/MOBILE_CORE_V1_READINESS_REVIEW.md`. Mobile Core React Native passe de
**`STARTER_UI_KIT_ALIGNED`** à **`IMPLEMENTATION_AVANCEE`**. À la date du review initial, critères
roadmap §9.4 : **7/8 satisfaits** (B1 upload runtime non prouvé). Après RN36/RN37, critères §9.4 :
**8/8 satisfaits** ; B1 fermé ; B3 fermé comme réserve formellement acceptée ; B2 iOS restait la seule réserve
active avant la décision finale V1.

**✅ Mobile Core RN36 — upload runtime starter proof : RÉALISÉ** (2026-07-13) :
écran protégé générique `app/(app)/upload.tsx` + `ROUTES.upload` + lien depuis Home. `useUploadMutation`
/ RHF+Zod / LoadingState/MessageState/ErrorState / fixture smoke hardcodée (no picker). Smoke Android
étendu : création fixture `adb shell sh -c`, mock `POST /files` (201), navigate → submit → `waitForNode('Upload complete')`.
Critères §9.4 : **8/8** satisfaits. B1 fermé. À la date RN36, `VALIDE_V1` restait différé par
B2 (iOS smoke) et B3 (PreferenceStore seam). RN37 a ensuite fermé B3 comme réserve formellement acceptée.

**✅ Mobile Core RN37 — PreferenceStore native strategy decision (B3) : RÉALISÉ** (2026-07-13) :
rapport `MOBILE_RN37_PREFERENCE_STORE_DECISION.md`. Analyse 4 options (seam, AsyncStorage, MMKV, délégation).
Décision : **store natif délégué aux projets dérivés — réserve formellement acceptée**.
MMKV rejeté (JSI → brise Expo Go + smoke). AsyncStorage rejeté (choix arbitraire entre deux options valides
per ADR-015). Seam `PreferenceStore` + `createPreferenceService` + gardes + placeholder + 367 tests agnostiques
= livrable « storage service » Foundation V1 (§9.3 roadmap). Pattern identique aux 10 autres seams Foundation.
**B3 fermé.** Avant décision finale V1, `VALIDE_V1` était différé uniquement par **B2 — iOS smoke**
(Linux/macOS). Prochaine action alors : RN31 si macOS/Xcode disponible, ou Mobile Core V1 final readiness decision.
Détail : [`NEXT_ACTIONS.md`](./NEXT_ACTIONS.md).

**✅ Mobile Core V1 final readiness decision : RÉALISÉ** (2026-07-13) :
rapport `MOBILE_CORE_V1_FINAL_READINESS_DECISION.md`. Décision : Mobile Core React Native passe de
**`IMPLEMENTATION_AVANCEE`** à **`VALIDE_V1`**. B2 iOS est acceptée comme réserve environnementale
non bloquante : `smoke:ios` reste `blocked` sur Linux, aucun smoke iOS réel n'est revendiqué, aucun
succès artificiel n'est créé. RN31 reste à exécuter dès qu'un environnement macOS/Xcode ou device iOS réel
est disponible.

**✅ V3 Entry Decision : RÉALISÉ** (2026-07-13) :
rapport `V3_ENTRY_DECISION.md`. Décision : ouvrir V3 par **Mobile Core Flutter**, mais uniquement par
**ADR-034 — Flutter UI : Material 3 vs composants maison**. Aucun starter Flutter, aucune dépendance,
aucun runtime. Prochaine action unique : rédiger et valider ADR-034 avant toute spec ou implémentation
Mobile Flutter.

**✅ V3 ADR-034 — Flutter UI stack decision : RÉALISÉ** (2026-07-14) :
ADR `docs/adr/ADR-034-flutter-ui-material3-vs-custom.md`. Décision : futur Mobile Core Flutter =
**Material 3 contrôlé par tokens Enistere + composants maison ciblés**. Material 3 est le moteur
Flutter, pas l'identité visuelle autonome. Aucun starter Flutter, aucune dépendance, aucun runtime.
Prochaine action unique : **Mobile Core Flutter 1 — Core specification**.

**✅ Mobile Core Flutter 1 — Core specification : RÉALISÉ** (2026-07-14) :
`cores/mobile-flutter/CORE_SPECIFICATION.md` (32 sections : modules obligatoires V1, go_router, Riverpod,
Dio, Freezed, flutter_secure_storage, Material 3 + tokens Enistere ADR-034, logger/redaction, préférences seam,
accessibilité, i18n, tests, missions ordonnées Flutter 1→V1, décisions pendantes) + `README.md`.
Statut `mobile-flutter` : **`SPECIFICATION_DOCUMENTAIRE`**. Aucun code Dart, `pubspec.yaml`, dépendance ou CI.

**✅ Mobile Core Flutter 2 — Starter minimal Flutter : RÉALISÉ** (2026-07-14) :
`pubspec.yaml` (flutter_riverpod 3.3.2, go_router 17.3.0, flutter_lints 6.0.0, mocktail 1.0.5),
`analysis_options.yaml`, `lib/main.dart` (`ProviderScope`), `lib/app.dart` (`MaterialApp.router`),
`lib/src/theme/` (`EnistereTokens` verbatim UI Kit, `EnistereThemeExtension`, `EnistereTheme` ADR-034),
`lib/src/app/router.dart` (GoRouter), `lib/src/features/home/home_screen.dart`.
Tests : `flutter test` 20/20 ✅ · `flutter analyze` 0 issues ✅ · `dart format` 0 changements ✅.
Statut `mobile-flutter` : **`STARTER_INITIALISE`**.

**✅ Mobile Core Flutter 3 — Auth shell + routing guards : RÉALISÉ** (2026-07-14) :
`lib/src/core/auth/` : `AuthStatus` (loading/authenticated/unauthenticated/expired), `AuthState`
(status + userId, JAMAIS de token), `SessionEnvelope`, `SessionStore` seam + `InMemorySessionStore`,
`AuthController` (Notifier<AuthState>, `_accessToken` privé en mémoire uniquement).
`lib/src/core/navigation/router.dart` : `routerProvider` GoRouter + `ValueNotifier<AuthState>` bridge +
redirect guards (loading → splash, authenticated → home, unauthenticated → sign-in).
`SplashScreen`, `SignInScreen` (placeholder sans backend), `HomeScreen` (sign-out).
Tests : `flutter test` 38/38 ✅ · `flutter analyze` 0 issues ✅ · `dart format` 0 ✅.
Statut `mobile-flutter` : **`AUTH_SHELL_READY`**.
Prochaine action : **Mobile Core Flutter 4 — Client Dio + providers**.

**✅ Mobile Core Flutter 4 — Client Dio + providers : RÉALISÉ** (2026-07-14) :
`pubspec.yaml` : `dio: ^5.10.0` ajouté.
`lib/src/core/config/api_config.dart` : `ApiConfig` (baseUrl, connectTimeoutMs, receiveTimeoutMs, sendTimeoutMs, commonHeaders).
`lib/src/core/api/app_api_error.dart` : `sealed class AppApiError implements Exception` + 11 sous-classes : `NetworkError`, `TimeoutError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ValidationError`, `TooLargeError`, `UnsupportedTypeError`, `RateLimitedError`, `ServerError`, `UnknownApiError`. Dart 3 sealed classes natives — aucun Freezed, aucun code gen.
`lib/src/core/api/error_interceptor.dart` : `mapDioError(DioException) → AppApiError` (top-level, testable directement) + `ErrorInterceptor` (`DioException → AppApiError` encapsulé dans `error`). Exhaustivité switch compile-time garantie.
`lib/src/core/api/logging_interceptor.dart` : `LoggingInterceptor(log?)` — log method + path UNIQUEMENT, jamais body/Authorization/query params/token/URL signée.
`lib/src/core/api/dio_client.dart` : `typedef TokenReader`, `CorrelationIdReader`, `ApiLogger` + `createDioClient(config, tokenReader, correlationIdReader?, logger?)`. Intercepteurs : `_AuthInterceptor` (inject Bearer + X-Request-Id dynamiquement) → `LoggingInterceptor` → `ErrorInterceptor`. Token lu au moment de chaque requête, jamais stocké dans la config.
`lib/src/core/api/dio_provider.dart` : `apiConfigProvider` (localhost:3000 dev) + `dioClientProvider` (`tokenReader` fermeture sur `AuthController.accessToken`). 401 surfacé sans refresh automatique.
Tests (`test/unit/api/`) : 48 tests — `app_api_error_test.dart` (12 : exhaustivité switch, isA<Exception>), `error_interceptor_test.dart` (19 : mapping pur + ErrorInterceptor via Dio+mock adapter), `logging_interceptor_test.dart` (6 : logs method+path, jamais body/Authorization), `dio_client_test.dart` (11 : config, injection token, token dynamique, non-fuite logs, correlationId, 401 sans retry).
Tests : `flutter test` 86/86 ✅ · `flutter analyze` 0 issues ✅ · `dart format` 0 ✅ · `quality-gates docs` 2/2 ✅.
Statut `mobile-flutter` : **`DIO_CLIENT_READY`**.

**✅ Mobile Core Flutter 5 — Upload multipart primitives : RÉALISÉ** (2026-07-14) :
`pubspec.yaml` : `http_parser: ^4.0.0` ajouté.
`lib/src/core/upload/app_file.dart` : `AppFile(path, name, mimeType, sizeBytes?)` + `SafeFileDescriptor(mimeType, extension?)` + `describeFileForLog` (jamais path ni nom brut — ADR-015/ADR-007) + `isValidAppFile` + `isAllowedUploadContentType` (exact, `image/*`, `*/*`, liste vide = tout autorisé).
`lib/src/core/upload/file_category.dart` : `enum FileCategory` (image/document/avatar/media/video/audio/identityDocument/attachment/other) + `FileCategoryExtension.apiValue` (→ `'IMAGE'` … `'IDENTITY_DOCUMENT'`).
`lib/src/core/upload/upload_result.dart` : `UploadedFileMetadata(id, category)` + `fromJson`. Jamais URL signée, bucket, device path, token.
`lib/src/core/upload/upload_service.dart` : `typedef MultipartFileFactory` injectable + `abstract interface class UploadService` + `DioUploadService(dio, uploadPath='/files', multipartFileFactory?)`. `FormData` construit frais à chaque appel. Content-Type posé par Dio avec boundary — jamais forcé manuellement. Erreurs : `e.error is AppApiError` → rethrow ; sinon `mapDioError`. Aucun retry automatique.
Tests (`test/unit/upload/`) : `app_file_test.dart` (21 : valid/invalid, sizeBytes optionnel, describeFileForLog sans path/nom, extensions sûres, isAllowedUploadContentType) + `upload_service_test.dart` (14 : uploadPath default, implements UploadService, POST /files, boundary auto, category API string, subjectId présent/absent, UploadedFileMetadata retourné, 413/415/401/réseau → AppApiError, token/path jamais dans les logs).
Tests : `flutter test` 120/120 ✅ · `flutter analyze` 0 issues ✅ · `dart format` 0 ✅ · `quality-gates docs` 2/2 ✅.
Statut `mobile-flutter` : **`UPLOAD_READY`**.
Prochaine action : **Mobile Core Flutter 6 — Tests + smoke**.

## 10. Règles à ne pas violer

- Vérifier le repository ; ne jamais se fier au seul rapport précédent.
- Ne jamais inventer un starter ni déclarer « validé » sans tests + revue.
- Ne pas confondre ADR / spécification / preuve / package / intégration.
- Un seul core par mission ; ne pas modifier API Core ou packages sans mission dédiée.
- Signaler tout état Git non propre ; ne pas supprimer une preuve sans remplacement vérifié.
- Mettre à jour `docs/project-status/` + `CHANGELOG.md` en fin de mission.

## 11. Fichiers à lire (dans l'ordre)

1. `docs/project-status/SESSION_HANDOFF.md` (ce fichier)
2. `docs/project-status/FOUNDATION_CURRENT_STATE.md`
3. `docs/project-status/IMPLEMENTATION_MATRIX.md`
4. `docs/project-status/NEXT_ACTIONS.md`
5. `docs/project-status/DECISIONS_REGISTER.md`
6. Pour le API Core : `cores/api-nestjs/docs/API_CORE_V1_IMPLEMENTATION_STATUS.md`

## 12. Commandes utiles

```bash
# Vérifier l'état réel
git status --short
find cores -maxdepth 2 -type f | sort
ls packages/*/

# API Core (cores/api-nestjs/) — nécessite PostgreSQL + MinIO jetables pour e2e
npm run build && npm run lint && npm run test
npm run openapi:check

# Packages (racine)
npm install && npm run build && npm test && npm run generate:check

# UI Kit (cores/ui-kit/)
npm run test --workspace=@enistere/ui-kit

# Web Core (cores/web-nextjs/) — port 3100
npm run check --workspace=@enistere/web-nextjs   # typecheck + lint + test + build
```
