# FOUNDATION_CURRENT_STATE.md — État courant officiel d'Enistere OS Foundation

> **Photographie officielle** de l'état réel du repository, vérifiée fichier par fichier.
> **Dernière mise à jour : 2026-06-12.**
>
> ⚠️ **Ne pas supposer qu'un core est implémenté parce que sa spécification existe.** Un
> `CORE_SPECIFICATION.md` ≠ un starter ; un README ≠ une implémentation ; un rapport ≠ une preuve
> runtime ; un dossier ≠ un core fonctionnel ; un ADR ≠ du code ; une preuve ≠ un package officiel ;
> un package officiel ≠ une intégration dans un core client.

## 1. Statut global

Le repository combine la **Phase 0 (stratégie + ADR + spécifications)** et des **implémentations
techniques réelles** : le **API Core NestJS**, deux **packages clients officiels**, et le **UI Kit**
(design tokens **+ premières primitives Web React**). Les autres cores sont **documentaires** ou
**vides**. **Aucun client Web/Mobile applicatif n'est implémenté** (le UI Kit fournit tokens + primitives,
pas une application ni une bibliothèque complète).

| Catégorie | État |
|---|---|
| Stratégie (Phase 0) | 10 documents présents |
| ADR | 18 ADR rédigés et **Validés** (001–016, 039, 040) ; ADR-017→038 = backlog non rédigé |
| Core implémenté | **API Core NestJS** (avancé, testé, revu) |
| Core en cours | **UI Kit** (`@enistere/ui-kit`, v0.1.1) — tokens **+ 9 primitives Web React** accessibles (Button/Input/Label/Text/Spinner/VisuallyHidden + **Alert/Card/FormField**, Web UI 1) ; **78 tests, 100 % couverture**, a11y ; aligné **React 19** ; **consommé par le Web Core** |
| Web Core | **`@enistere/web-nextjs`** — **IMPLEMENTATION_PARTIELLE** : Next 16 App Router + React 19, UI Kit + **API publique (Health) + TanStack Query** + **BFF Auth** (`login`/`refresh`/`logout`/`csrf`, cookies `HttpOnly`, **CSRF**, Origin/Referer) + **session/autorisations** (`me`/`authorization` read-only, `useSession`/`useAuthorization`, purge au logout) + **layout protégé** (résolution Auth **serveur** read-only Option C + hydratation, page `/protected`) + **page de connexion `/login`** (formulaire accessible, login BFF, `returnTo` interne assaini anti open-redirect, navigation `replace`/`refresh`) + **états UI & composants structurels** (Web UI 1 : `Alert`/`Card`/`FormField` consommés ; `LoadingState`/`EmptyState`/`ErrorState`/`UnauthorizedState`(401)/`ForbiddenState`(403)/`ServiceUnavailableState`/`PageHeader`, intégrés accueil/Health/frontières/Auth) + **Files lecture/téléchargement** (Web Files 1 : BFF ciblé `GET /api/files/:id` + `POST /api/files/:id/download-url`, validation UUID, **CSRF/Origin** sur download-url, client BFF navigateur, `fileKeys`, `useFileMetadata` + `useCreateDownloadUrl` (**URL signée jamais en cache/log**), page `/protected/files/[id]`, **404 anti-énumération** ; **aucun upload/suppression/admin**, **aucun champ interne** exposé). **307 tests** + preuves API réelles (Auth/session **26/26** + login **22/22** + **Files API+MinIO 21/21**). **Pas de middleware, pas de Server Action Auth, pas de token en JS, pas de proxy générique.** |
| Packages officiels | `@enistere/api-contracts`, `@enistere/api-client-fetch` (validés **localement**, non publiés ; **instanciés (public + authentifié/BFF)** dans le Web Core — preuve API réelle) |
| Cloud Core | **`cores/cloud`** — **IMPLEMENTATION_PARTIELLE** (CC1 cadrage + **CC2 CI runtime API** + **CC3 CI E2E navigateur**) : `api-runtime-ci.yml` (PostgreSQL+MinIO jetables, migrations, unit+e2e, openapi:check) **+ `web-e2e-ci.yml`** (stack réelle API+PG+MinIO+Web + **Playwright/Chromium** : Health/Auth/Files) + cadrage (baseline, politiques, checklist branch protection) ; **aucune infra de déploiement/registry/monitoring** |
| Core mobile (socle) | **`mobile-react-native`** — **APP_ENVIRONMENT_READY** : socle **Expo SDK 55** / Expo Router (RN 1) + auth/session durci (RN 2) + forms/validation/offline (RN 3) + **client officiel `@enistere/api-client-fetch` intégré** (RN 4 : `file:` + Metro, **root non touché** ; `MobileAuthSessionAdapter` injection Bearer ; `EnistereAuthApi` ; **AuthEngine préservé**) + **pont 401** `authedRequest` (RN 4B : `401`→`refreshSession` coalescé→1 retry→purge, `enableRefresh:false`) **+ RN 5 — couche server-state** : TanStack Query générique (`createQueryKeys` clés stables typées, `useAuthedQuery`/`useAuthedMutation` **via `authedRequest`**, `toQueryError` **sans donnée sensible**, `invalidateScope`/`purgeServerState`) — **401 jamais retenté, mutations sans retry, pas de persistance** **+ RN 6 — état local (Zustand) + purge logout** : `useUiStore` générique (`themePreference` + `flags` booléens) **séparé du server-state** (anti-pattern spec §57), **sans donnée sensible ni persistance** ; **purge déterministe câblée au logout** (`signOut`/`expired` → `await cancelQueries`→`clear`, `AuthEngine` inchangé) **+ RN 7 — primitives d'upload sécurisé multipart** (ADR-007) : descripteur RN `MobileFile {uri,name,type}` (**assignable** au `ReactNativeFileDescriptor` du package) + helpers purs (`isMobileFile`, `describeFileForLog` **sans `uri`**, `isAllowedFileType` pré-check UX) + `useUploadMutation` via `useAuthedMutation` → `apiClient.files.upload(file, category, {retryOnAuthRefresh:false})` (**refresh 401 = AuthEngine**, `FormData` reconstruit au retry) ; **mutation → aucune clé de cache**, **aucun fichier/URL signée/token/Authorization** en cache/log/store ; `toQueryError` étendu **413/415** ; **backend autoritaire**, aucun endpoint métier/écran **+ RN 8 — logger/observabilité (avec redaction)** (ADR-040) : `createLogger` (`debug`/`info`/`warn`/`error`, niveaux, **sink pluggable**, horloge injectée, corrélation `child`/`withRequestId`) + **redaction centrale** (`redactValue`/`redactString` : tokens/`Authorization`/cookies/JWT/**URL signées**/**chemins device**/**PII**) **avant** tout sink ; `safeErrorFields(QueryError)` ; correctif `describeFileForLog` (`{type,extension}`, plus de nom brut) ; **aucune persistance/transport réseau/service externe/log de body** **+ RN 9 — permissions natives génériques gouvernées** (07_SECURITY §6 / ADR-015) : modèle pur `PermissionKind`/`PermissionStatus` + `normalizePermissionStatus`/helpers ; `PermissionAdapter` (seam Expo) + `createPermissionService` (live `getStatus`/`request`/`ensure`/`openSettings`, **logs sûrs** `{kind,status}` via logger RN 8, `PermissionAdapterError` contrôlé) ; **adaptateur placeholder** (no native dep) ; hook `usePermission` (**no UI**) ; **statut jamais persisté** ; **API Core = autorité** **+ RN 10 — notifications locales génériques** (07_SECURITY §13 / ADR-040) : `NotificationMessage` borné/sûr (`sanitizeNotificationMessage`, `describeNotificationForLog` **sans contenu**) + delivery-state/`normalizeTrigger` ; `NotificationAdapter` (seam Expo) + `createNotificationService` (**gate** sur permission `notifications` RN 9, **jamais de schedule sans permission usable**, `schedule`/`cancel`/`cancelAll`/`getDelivered`, **logs sûrs**, `NotificationError` contrôlé) ; **placeholder** no native dep ; **LOCAL only** (aucun push/token device/stockage/UI) **+ RN 11 — i18n / localisation primitives génériques** (08_STANDARDS / 06_DEPENDENCY) : modèle de locale (`normalizeLocale` via `Intl`, `getLocaleDirection`, `resolveLocale`) + **catalogue typé** (`createTranslator` : interpolation, **pluralisation `Intl.PluralRules`**, clé inconnue **sans throw**) + **formatters `Intl`** (`formatDate`/`formatNumber`/`formatCurrency`, devise requise, **ne lèvent jamais**) ; `LocaleAdapter` + **placeholder** (no native dep) + `createLocalization` ; **aucune dépendance** (Intl built-in), aucun réseau/persistance/UI, **catalogues métier = projets dérivés** **+ RN 12 — deep-linking / routing primitives génériques** (07_SECURITY §7/§8) : parseur pur (`parseDeepLink`/`decodeSafe`/`normalizeUrl`, custom + `https`, **sans `URL` global**) + **`resolveLink`** (`internal`/`externalBlocked`/`invalid`) — **allowlist stricte** schemes/hosts, **anti-open-redirect** (`//`/`scheme://`/`..`), **params sensibles supprimés**, bornes ; `isInternalRoute` ; **`resolveNotificationLink`** (clé configurable) ; **aucun log/stockage/dépendance** ; routes concrètes = projets dérivés **+ RN 13 — analytics / télémétrie primitives génériques (avec redaction, sans SDK réel)** (07_SECURITY §13 / ADR-040) : `AnalyticsEvent` borné + **redaction dédiée basée RN 8** (`sanitizeAnalyticsEvent` : `isSensitiveProperty` **réutilise `isSensitiveKey`** + scrub valeurs via **`redactString`**, bornes, **sans throw**) ; `AnalyticsAdapter` (track/flush?, **pas de `identify`**) + `createAnalyticsService` (track **best-effort non-intrusif**, **logs sûrs** `{eventName,propertyCount}`, erreurs adapter contrôlées) ; **placeholder** mémoire ; **aucun SDK réel/réseau/persistance/user-id réel/token** **+ RN 14 — accessibilité (a11y) primitives génériques** (ADR-010 §16 / spec §45) : props RN-compatibles (`buildA11yProps`/`normalizeA11yText` borné) + **`A11yState`** normalisé (`disabled`/`focused`/`pressed`/`invalid` + RN state ; `mergeA11yState`/`isInteractiveRole`) + **annonce** (`sanitizeAnnouncement`, `describeAnnouncementForLog` **sans texte**) + `A11yAdapter` (announce/focus?/isScreenReaderEnabled?, `A11yAdapterError` contrôlé) + **placeholder** + `createA11yService` (best-effort **non-intrusif**, **logs sûrs** `{length,assertive}`) ; **aucun `AccessibilityInfo` réel/provider global/stockage/UI/dépendance** **+ RN 15 — app lifecycle primitives génériques** (02/06 / ADR-040) : modèle `AppLifecycleState` (`active`/`background`/`inactive`/`unknown`) + helpers purs (`normalizeAppLifecycleState` tolérant, `isForeground`/`isBackground`, `isValidTransition` matrice, `nextAppLifecycleState`) ; `AppLifecycleAdapter` (seam RN `AppState`) + `AppLifecycleAdapterError` + **placeholder** + `createAppLifecycleService` (`getState`/`subscribe`/`transition`/`dispose`, transitions **validées**, **best-effort non-intrusif**, listener **isolé**, **logs sûrs** `{from,to}` enums) ; **aucun `AppState` réel/provider global/stockage/dépendance** **+ RN 16 — connectivité réseau (network status) primitives génériques** (ADR-015 §19 / 06) : **étend `src/offline`** (RN 3 inchangé, **`shouldQueueMutations` canonique**) — `NetworkConnectionType` borné + `normalizeNetworkStatus`/`normalizeConnectionType` ; `NetworkAdapter` (seam RN NetInfo) + `NetworkAdapterError` + **placeholder** + `createNetworkService` (`getStatus(): NetworkState`/`shouldQueue`/`subscribe`/`transition`/`dispose`, `changedAt` via **horloge injectée**, **best-effort non-intrusif**, listener **isolé**, **logs sûrs** `{from,to,type}` enums) ; **aucun NetInfo réel/dépendance/offline sync/persistance/donnée sensible** **+ RN 17 — feature flags / config primitives génériques** (ADR-015 §19/§21 / 06) : **étend `src/config`** (env inchangé, **distinct des `flags` UI Zustand RN 6**) — `FlagValue` (boolean/string/number) + `FlagSet` **bornés** (`MAX_FLAG_KEY_LENGTH`/`MAX_FLAG_VALUE_LENGTH`/`MAX_FLAGS`) + `isValidFlagKey`/`normalizeFlagValue`/`sanitizeFlagSet` tolérants + **getters typés à défaut sûr** (`getBooleanFlag`/`getStringFlag`/`getNumberFlag`/`getFlagValue<T>` — valeur rendue **seulement si le type correspond**) + `describeFlagsForLog` → **`{count}` seulement** ; `FlagAdapter` (seam local/remote-config) + `FlagAdapterError` + **placeholder** mémoire + `createFlagService` (`getFlag`/`getAll`/`subscribe`/`refresh`/`dispose`, **best-effort non-intrusif**, listener **isolé**, **logs sûrs** `{count}`/`{operation}` — **jamais clé ni valeur**) ; **aucun SDK remote-config réel/réseau/persistance/user targeting réel/secret/donnée sensible** **+ RN 18 — gate biométrique local primitives génériques** (ADR-015 §20/§21) : `src/biometrics` — `BiometricAvailability` (`available`/`notEnrolled`/`unsupported`/`unknown`) + `BiometricType` borné (`fingerprint`/`facial`/`iris`/`unknown`) + `BiometricAuthOutcome` (`success`/`refused`/`cancelled`/`lockout`/`unavailable`/`error`) ; helpers **tolérants** (**junk → `unknown`/`error`, jamais `success`**) + objets **gelés** ; `BiometricAdapter` (seam Expo `LocalAuthentication`/Keychain) + `BiometricAdapterError` + **placeholder** mémoire + `createBiometricService` (`getAvailability`/`isAvailable`/`authenticate`, **stateless**, **aucun faux succès** — `unavailable` **sans prompt** si inutilisable, **logs sûrs** `{availability,type}`/`{outcome}`/`{operation}` — **jamais prompt ni cause native**) ; **gate d'UX local — ne remplace JAMAIS l'auth serveur (API Core = autorité)** ; **aucun `LocalAuthentication`/Keychain réel/secret/biométrie/résultat/profil stocké** **+ RN 19 — crash / error-reporting primitives génériques (seam, sans SDK réel)** (ADR-040 §17/§18/§19 / ADR-015 §12/§21/§24) : `src/crash-reporting` — `CrashReportEvent` borné (`severity`/`source`/`name`/`message`/`stack?`/`context`) **rédigé via la redaction centrale RN 8** + bornes (`sanitizeCrashMessage`/`sanitizeCrashStack` **jamais de stack brute** + cap frames/`sanitizeCrashContext` clés sensibles → `[Redacted]`) + `createCrashReportEvent` (gelé) + `describeCrashEventForLog` → `{severity,source}` ; `CrashReporterAdapter` (seam Sentry/Crashlytics) + `CrashReporterAdapterError` + **placeholder** mémoire (copies défensives) + `createCrashReporterService` (`captureError`/`captureMessage`/`setContext`/`flush`, **best-effort non-intrusif** — sync throw + async reject capturés, **jamais de faux succès**, **logs sûrs** `{operation,severity,source}`) ; **sans SDK réel/réseau/persistance/batching/crash handler global ; ne décide PAS ADR-019 ; aucun token/URL signée/URI device/PII/body/stack brute/user-id réel** **+ RN 20 — préférences non sensibles persistantes primitives génériques (seam, sans MMKV/AsyncStorage réel)** (ADR-015 §15/§16) : `src/preferences` — `PreferenceValue` (bool/string/number) + `PreferenceSet` bornés + `isValidPreferenceKey` (format **+ non sensible**, réutilise `isSensitiveKey`) + `isSensitivePreferenceValue` + `sanitizePreferenceSet` + getters typés à défaut sûr ; `PreferenceStore` (seam **async** MMKV/AsyncStorage) + `PreferenceStoreError` + **placeholder** mémoire (copies défensives) + `createPreferenceService` (`get`/`getBoolean`/`getString`/`getNumber`/`set`/`remove`/`clear`/`getAll`/`subscribe` — **garde les écritures** (clé/valeur sensible → drop) + **assainit les lectures**, **best-effort non-intrusif**, listener isolé, **logs sûrs** `{operation,count}`) ; **données NON sensibles uniquement — distinct de SecureStore/Zustand RN 6/TanStack Query ; aucun MMKV/AsyncStorage réel/réseau/secret/PII ; ne décide aucun stockage natif** **+ RN 21 — consentement télémétrie / privacy gate primitives génériques** (ADR-038) : `src/consent` — `ConsentCategory` (`analytics`/`crash`/`performance`/`diagnostics`) + `ConsentStatus` (`granted`/`denied`/`unknown`) + `ConsentSet` ; `normalizeConsentCategory` (inconnue → ignorée) + `normalizeConsentStatus` (junk → `unknown`) + `sanitizeConsentSet` + `isConsentGranted` + **`isTelemetryAllowed`** = **default-deny** ; `ConsentStore` (seam, `ConsentStoreError`) + **`createPreferenceConsentStore`** (persistance **déléguée aux préférences RN 20**, clés non sensibles `privacy.consent.*`) + placeholder mémoire (copies défensives) + `createConsentService` (`get`/`set`/`isAllowed`/`getAll`/`clear`/`subscribe`, **best-effort** — store défaillant → non autorisé, listener isolé, **logs sûrs** `{operation,category,status}`/`{operation,count}`) ; **gate à consulter AVANT émission analytics RN 13 / crash RN 19 ; aucun SDK réel/réseau/UI/identifiant/PII ; ne décide PAS ADR-038 ; ne câble pas analytics/crash** **+ RN 22 — environnement / métadonnées app primitives génériques non identifiantes (seam, sans `expo-application`/`expo-device` réel)** (07_SECURITY / ADR-040) : `src/app-environment` — `AppEnvironmentSnapshot` **borné, allow-list stricte** (`os` ios/android/web/unknown + `osVersionMajor` **majeur seulement** + `appVersion`/`buildNumber`/`buildChannel`/`locale`/`environment`) + normalizers tolérants (**`normalizeMajorVersion`** `17.5.1`→`17`, `normalizeLocaleField` via i18n) + **`sanitizeAppEnvironmentSnapshot`** (lit **uniquement** les clés autorisées → **drop** deviceId/IDFA/AndroidID/installationId/pushToken/serial/model/IP ; gelé) + `describeAppEnvironmentForLog` (grossier) ; `AppEnvironmentAdapter` (seam `expo-application`/`expo-device`) + `AppEnvironmentAdapterError` + **placeholder** mémoire (copies défensives) + `createAppEnvironmentService` (`getSnapshot`/`describeForContext`, best-effort → `{os:unknown}` sans throw, **ne persiste rien**, **ne collecte rien auto**, **logs sûrs** `{operation}`+grossiers) ; **contexte sûr pour analytics RN 13 / crash RN 19 — gaté par le consentement RN 21 ; aucun identifiant device (IDFA/Android ID/installation id/serial/MAC/IP)/modèle précis/PII/collecte auto ; ne décide ni ADR-038/ADR-019/ADR-018** ; erreurs `ApiClientError` ; **320 tests `node --test`** ; **typecheck + lint + test 320/320 + expo-doctor 19/19 + `expo export` ios** verts ; **aucune logique métier** |
| Cores documentaires | _(aucun ; `mobile-react-native` est passé au starter ci-dessus)_ |
| Cores vides | `ai-core`, `api-spring`, `docs-core`, `mobile-flutter`, `quality-core`, `web-angular` |
| CI/CD, conteneurisation | **CI niveaux 1–3 + registry (niveau 4 partiel)** : `ci.yml` + `api-runtime-ci.yml` + `web-e2e-ci.yml` + **`registry-ci.yml`** (build + push images GHCR, **images publiques validées** ; ADR-013/014 **partiels**) ; **Dockerfiles** API/Web (multi-stage, non-root) ; **staging cadré** (CC6) + **dry-run** (CC7) + **image API corrigée** (CC8, `api-smoke` gate le push) + **exécution staging contrôlée LOCALE** (CC9 : images corrigées `sha-d1e6242`, stack `healthy`, endpoint Option A joignable), `EXECUTION_LOCALE_CONTROLEE` ; **déploiement sur serveur réel / HTTPS / URL signée bout-en-bout non encore réalisés** |
| **État Git** | Historique Git actif ; `main` aligné sur `origin/main` au merge RN 3 `574cdcf` ; flux PR actif |

## 2. Principes de vérité

Hiérarchie de confiance (du plus fiable au moins fiable) : **(1)** fichiers/code réels ; **(2)** tests,
scripts, `package.json`, migrations, configs ; **(3)** ADR validés ; **(4)** `CORE_SPECIFICATION.md` ;
**(5)** `strategy/` ; **(6)** README/rapports ; **(7)** CHANGELOG. En cas de contradiction, le code et
les tests réels priment ; un ADR validé prime sur un choix ouvert dans une spécification ; une
spécification ne prouve pas un starter ; un dossier vide ne prouve aucune implémentation.

## 3. Architecture du repository

```
enistere-os-foundation/
  strategy/            10 docs Phase 0 (01..10)
  docs/
    adr/               18 ADR (001–016, 039, 040) + ADR_BACKLOG + ADR_V1_BLOCKING_REVIEW
    project-status/    CE checkpoint (source de pilotage officielle)
    checklists/ decisions/ glossary/ guides/ onboarding/ runbooks/
  cores/
    api-nestjs/        IMPLÉMENTÉ (src, prisma, test, openapi, scripts, docs, proofs/)
    ui-kit/            STARTER (tokens + 6 primitives Web, React 19) — v0.1.1
    web-nextjs/        PARTIEL (Next 16 + React 19 ; UI Kit + API publique + TanStack Query + BFF Auth login/refresh/logout/csrf + me/authorization + session state + UI 1 états + Files 1 lecture/téléchargement)
    cloud/             IMPLEMENTATION_PARTIELLE (spec + README + docs/ + CI runtime API + E2E navigateur + registry GHCR : api-runtime-ci.yml, web-e2e-ci.yml, registry-ci.yml + Dockerfiles)
    mobile-react-native/  APP_ENVIRONMENT_READY (Expo SDK 55 + Expo Router : app/ + src/{a11y,analytics,api,app-environment,app-lifecycle,auth,biometrics,config,consent,crash-reporting,forms,i18n,linking,logger,navigation,notifications,offline,permissions,preferences,query,store,storage,theme,types,ui,upload} + metro.config.js + test/ node --test ; AuthEngine + SessionStore + 401-refresh ; forms RHF+Zod ; offline queue mémoire ; client OFFICIEL @enistere/api-client-fetch lié file: + pont 401 authedRequest ; couche server-state TanStack Query générique ; état local Zustand (useUiStore, séparé) + purge logout déterministe câblée ; primitives upload multipart (MobileFile + useUploadMutation, backend autoritaire) ; logger générique + redaction centrale (tokens/URL signées/chemins device/PII) ; permissions runtime génériques (status/adapter/service/placeholder/usePermission, jamais persistées) ; notifications locales génériques (message borné/sûr + service gouverné par permission RN 9 + placeholder, sans push/token device) ; i18n/localisation générique (locale/catalogue typé/pluralisation/formatters Intl + adapter + placeholder + service, no native dep, catalogues métier = projets dérivés) ; deep-linking/routing générique (parseDeepLink + resolveLink allowlist/anti-open-redirect + resolveNotificationLink, no native dep, routes concrètes = projets dérivés) ; analytics/télémétrie générique (event+redaction basée RN 8 + adapter sans identify + service best-effort + placeholder, sans SDK/réseau/persistance/user-id) ; accessibilité a11y générique (state+props RN-compatibles + annonce + adapter + service best-effort + placeholder, sans AccessibilityInfo réel/provider global/stockage) ; app lifecycle générique (état active/background/inactive/unknown + transitions validées + adapter seam RN AppState + placeholder + service subscribe/transition, sans AppState réel/provider global/stockage) ; connectivité réseau générique (étend offline : NetworkConnectionType + adapter seam RN NetInfo + placeholder + service, shouldQueueMutations canonique, sans NetInfo réel/sync) ; feature flags/config génériques (étend config : FlagValue/FlagSet bornés + sanitizeFlagSet + getters typés à défaut sûr + adapter seam local/remote-config + placeholder mémoire + createFlagService getFlag/getAll/subscribe/refresh/dispose, distinct des flags UI Zustand RN 6, logs {count}/{operation} jamais clé ni valeur, sans SDK remote-config réel/réseau/persistance/user targeting/secret) ; gate biométrique local générique (src/biometrics : availability/type/outcome normalisés + helpers tolérants junk→unknown/error jamais success + adapter seam Expo LocalAuthentication/Keychain + placeholder mémoire + createBiometricService getAvailability/isAvailable/authenticate, gate d'UX local sans faux succès — unavailable sans prompt si inutilisable, ne remplace jamais l'auth serveur, logs {availability,type}/{outcome}/{operation} jamais prompt ni cause native, sans LocalAuthentication/Keychain réel/secret/biométrie/résultat stocké) ; crash/error-reporting générique (src/crash-reporting : CrashReportEvent borné rédigé via redaction RN 8 + sanitizeCrashMessage/sanitizeCrashStack jamais de stack brute/sanitizeCrashContext + adapter seam Sentry/Crashlytics + placeholder mémoire copies défensives + createCrashReporterService captureError/captureMessage/setContext/flush, best-effort non-intrusif sans faux succès, logs {operation,severity,source} jamais le contenu, sans SDK réel/réseau/persistance/batching/crash handler global, ne décide pas ADR-019) ; préférences non sensibles persistantes génériques (src/preferences : PreferenceValue bool/string/number + PreferenceSet bornés + isValidPreferenceKey format+non sensible + isSensitivePreferenceValue + sanitizePreferenceSet + getters typés à défaut sûr + store seam async MMKV/AsyncStorage + placeholder mémoire copies défensives + createPreferenceService get/set/remove/clear/getAll/subscribe, garde écritures + assainit lectures clé/valeur sensible → drop, best-effort non-intrusif listener isolé, logs {operation,count} jamais clé ni valeur, données non sensibles uniquement distinct de SecureStore/Zustand RN 6/TanStack Query, sans MMKV/AsyncStorage réel/réseau/secret/PII, ne décide aucun stockage natif) ; consentement télémétrie / privacy gate générique (src/consent : ConsentCategory analytics/crash/performance/diagnostics + ConsentStatus granted/denied/unknown + ConsentSet + normalize*/sanitizeConsentSet/isConsentGranted/isTelemetryAllowed default-deny + store seam + createPreferenceConsentStore persistance déléguée aux préférences RN 20 clés non sensibles privacy.consent.* + placeholder mémoire copies défensives + createConsentService get/set/isAllowed/getAll/clear/subscribe, best-effort store défaillant → non autorisé listener isolé, logs {operation,category,status}/{operation,count} jamais de valeur utilisateur, gate à consulter avant émission analytics RN 13/crash RN 19, sans SDK réel/réseau/UI/identifiant/PII, ne décide pas ADR-038, ne câble pas analytics/crash) ; environnement / métadonnées app génériques non identifiantes (src/app-environment : AppEnvironmentSnapshot borné/allow-list os/osVersionMajor majeur/appVersion/buildNumber/buildChannel/locale/environment + normalizers tolérants 17.5.1→17 + locale via i18n + sanitizeAppEnvironmentSnapshot lit uniquement les clés autorisées → drop deviceId/IDFA/AndroidID/pushToken/serial/model/IP + describeAppEnvironmentForLog grossier + adapter seam expo-application/expo-device + placeholder mémoire copies défensives + createAppEnvironmentService getSnapshot/describeForContext best-effort {os:unknown} si throw ne persiste rien, contexte sûr gaté par consentement RN 21, sans expo-device/expo-application réel/identifiant device/PII/collecte auto, ne décide ni ADR-038/ADR-019/ADR-018) ; autonome hors workspaces)
    ai-core/ api-spring/ docs-core/ mobile-flutter/ quality-core/ web-angular/   → vides
  packages/
    api-contracts/     @enistere/api-contracts (0.1.0, privé)
    api-client-fetch/  @enistere/api-client-fetch (0.1.0, privé)
  package.json         racine privé, workspaces ["packages/*","cores/ui-kit","cores/web-nextjs"]
  prompts/ templates/  présents ; tools/ examples/ vides
  README.md CHANGELOG.md
```

## 4. Cores

| Core | Dossier | Spécification | Starter/code | Statut officiel |
|---|---|---|---|---|
| `api-nestjs` | oui | oui | **oui** | **IMPLEMENTATION_AVANCEE** |
| `ui-kit` | oui | oui | **oui** (tokens + primitives Web, React 19) | **IMPLEMENTATION_PARTIELLE** |
| `cloud` | oui | oui | **partiel** (CI runtime API + cadrage docs ; pas d'infra déploiement) | **IMPLEMENTATION_PARTIELLE** |
| `web-nextjs` | oui | oui | **oui** (Next 16 + UI Kit + API publique + TanStack Query + BFF Auth + session/autorisations + UI 1 états + Files 1 lecture) | **IMPLEMENTATION_PARTIELLE** |
| `mobile-react-native` | oui | oui | **oui** (Expo SDK 55 + Expo Router : navigation auth/privé durcie, AuthEngine + refresh coalescé + expiration, SessionStore SecureStore, **client OFFICIEL `@enistere/api-client-fetch` intégré** (file: + Metro) + adaptateur de session + pont 401 `authedRequest`, **couche server-state TanStack Query générique** (query-keys/useAuthedQuery/Mutation/toQueryError/purge) + **état local Zustand** (séparé) + **purge logout déterministe câblée** + **primitives upload multipart** (MobileFile + useUploadMutation, backend autoritaire) + **logger générique + redaction centrale** (tokens/URL signées/chemins device/PII) + **permissions runtime génériques** (status/adapter/service/placeholder/usePermission, jamais persistées) + **notifications locales génériques** (message borné/sûr + service gouverné par permission RN 9 + placeholder, sans push/token device) + **i18n/localisation générique** (locale/catalogue typé/pluralisation/formatters Intl + placeholder + service, no native dep) + **deep-linking/routing générique** (parseDeepLink + resolveLink allowlist/anti-open-redirect + resolveNotificationLink, no native dep) + **analytics/télémétrie générique** (event+redaction basée RN 8 + adapter sans identify + service best-effort + placeholder, sans SDK/réseau/persistance/user-id) + **accessibilité a11y générique** (state+props RN-compatibles + annonce + adapter + service best-effort + placeholder, sans AccessibilityInfo réel/provider global) + **app lifecycle générique** (état active/background/inactive/unknown + transitions validées + adapter seam RN AppState + placeholder + service, sans AppState réel/provider global) + **connectivité réseau générique** (étend offline : NetworkConnectionType + adapter seam RN NetInfo + placeholder + service, shouldQueueMutations canonique, sans NetInfo réel) + **feature flags/config génériques** (étend config : FlagValue/FlagSet bornés + sanitizeFlagSet + getters typés à défaut sûr + adapter seam local/remote-config + placeholder + createFlagService, distinct des flags UI Zustand RN 6, logs {count} jamais clé ni valeur, sans SDK remote-config réel/réseau/persistance/user targeting) + **gate biométrique local générique** (availability/type/outcome normalisés + helpers tolérants + adapter seam Expo LocalAuthentication/Keychain + placeholder + createBiometricService, gate d'UX sans faux succès, ne remplace jamais l'auth serveur, logs enums jamais prompt/cause, sans LocalAuthentication/Keychain réel/secret/biométrie stocké) + **crash/error-reporting générique** (CrashReportEvent borné rédigé via redaction RN 8 + sanitizeCrash* jamais de stack brute + adapter seam Sentry/Crashlytics + placeholder copies défensives + createCrashReporterService captureError/captureMessage/setContext/flush, best-effort sans faux succès, logs {operation,severity,source}, sans SDK réel/réseau/persistance, ne décide pas ADR-019) + **préférences non sensibles persistantes génériques** (PreferenceValue/PreferenceSet bornés + garde anti-secret (isSensitiveKey + isSensitivePreferenceValue) + store seam async MMKV/AsyncStorage + placeholder copies défensives + createPreferenceService get/set/remove/clear/getAll/subscribe, garde écritures + assainit lectures, best-effort, logs {operation,count}, données non sensibles uniquement distinct de SecureStore/Zustand/TanStack Query, sans MMKV/AsyncStorage réel) + **consentement télémétrie / privacy gate générique** (ConsentCategory/ConsentStatus + isTelemetryAllowed default-deny + store seam + createPreferenceConsentStore délégué aux préférences RN 20 + placeholder + createConsentService get/set/isAllowed/getAll/clear/subscribe, best-effort, logs enums/count, gate à consulter avant émission analytics/crash, sans SDK/réseau/UI/identifiant/PII, ne décide pas ADR-038) + **environnement / métadonnées app génériques non identifiantes** (AppEnvironmentSnapshot borné/allow-list + normalizers tolérants (17.5.1→17) + sanitizeAppEnvironmentSnapshot drop identifiants + adapter seam + placeholder + createAppEnvironmentService getSnapshot/describeForContext, best-effort, ne persiste rien, contexte sûr gaté par consentement RN 21, sans expo-device/expo-application réel/identifiant device/PII/collecte auto), ThemeProvider, états, forms RHF+Zod, offline queue mémoire ; 320 tests + bundle Metro) | **APP_ENVIRONMENT_READY** |
| `ai-core` | oui (vide) | non | non | **DOSSIER_SEULEMENT** |
| `api-spring` | oui (vide) | non | non | **DOSSIER_SEULEMENT** |
| `docs-core` | oui (vide) | non | non | **DOSSIER_SEULEMENT** |
| `mobile-flutter` | oui (vide) | non | non | **DOSSIER_SEULEMENT** |
| `quality-core` | oui (vide) | non | non | **DOSSIER_SEULEMENT** |
| `web-angular` | oui (vide) | non | non | **DOSSIER_SEULEMENT** |

**API Core NestJS** — modules présents : `config`, `database` (Prisma/PostgreSQL), `health`,
`auth` (login, sessions, refresh, JWT), `users`, `roles`, `permissions`, `audit`, `files` (S3/MinIO),
`common` (logging Pino, filtres, interceptors, OpenAPI), `bootstrap`, `upload` (cadrage). **5
migrations** Prisma, **47 specs unitaires**, **12 specs e2e**, snapshot OpenAPI canonique versionné,
seed RBAC, commandes CLI fichiers. Rapports : `API_CORE_V1_REVIEW`, `AUTH_RBAC_REVIEW`, `FILES_REVIEW`,
`API_CORE_V1_IMPLEMENTATION_STATUS`, `API_CORE_V1_NEXT_ROADMAP`, `OPENAPI_CLIENT_PROOF`,
`STRUCTURED_LOGGING_COMPATIBILITY_PROOF`. Détail : [`../../cores/api-nestjs/docs/API_CORE_V1_IMPLEMENTATION_STATUS.md`](../../cores/api-nestjs/docs/API_CORE_V1_IMPLEMENTATION_STATUS.md).

## 5. Packages

| Package | Version | Privé | Build/Tests | Publié | Intégré dans un core |
|---|---|---|---|---|---|
| `@enistere/api-contracts` | 0.1.0 | oui | oui (types-only, 11 tests) | **non** | **consommé (types) dans `web-nextjs`** (Health + Auth + **Files** : `PublicStoredFileDto`/`SignedDownloadResponseDto` via `SchemaOf<>`) |
| `@enistere/api-client-fetch` | 0.1.0 | oui | oui (29 tests + live 16/16) | **non** | **instancié (public/Health + authentifié/BFF Auth + façade Files lecture) dans `web-nextjs`** |

Dépendance à sens unique : `openapi.json → api-contracts → api-client-fetch`. Le **UI Kit** et les
**paquets API** sont désormais **réellement intégrés** par le Web Core pour les endpoints **publics**
(Health) **et authentifiés** (BFF Auth : login/refresh/logout/me/authorization) : `api-client-fetch` est
**instancié** (factory serveur par requête + client public navigateur + façade Auth serveur), avec preuve
**API réelle**. Côté navigateur, l'état de session est lu via le **client BFF same-origin** (`/api/auth/*`),
sans token ni appel direct à l'API.

## 6. Stratégie (Phase 0)

10 documents présents (`strategy/01_VISION_FINAL.md` … `10_AI_STRATEGY.md`). Certains décrivent un état
« avant code » ou des choix désormais tranchés par des ADR : à lire comme **contexte historique**,
non comme l'état courant (voir §16). Non modifiés par cette mission.

## 7. ADR

**18 ADR rédigés et Validés** : ADR-001..016, ADR-039, ADR-040. ADR-017→038 sont **listés dans
`ADR_BACKLOG.md`** mais **non rédigés** (statut « À rédiger », futurs/non bloquants). Détail et statut
d'implémentation : [`DECISIONS_REGISTER.md`](./DECISIONS_REGISTER.md).

## 8. Implémentations

Implémenté + testé + revu : Auth, sessions, refresh, RBAC, permissions, audit, Files (S3/MinIO),
logging structuré, contrat OpenAPI canonique. Implémenté côté Web Core : UI Kit consommé, API publique
(Health) + TanStack Query (SSR/hydratation), **BFF Auth** (cookies `HttpOnly`, CSRF double-submit,
Origin/Referer), **état de session/autorisations** (`me`/`authorization` read-only, `useSession`/
`useAuthorization`, purge cache au logout), **états UI standardisés** (UI 1) **et Files en lecture** (Files 1 :
BFF ciblé métadonnées + URL signée + téléchargement direct, `useFileMetadata`/`useCreateDownloadUrl`, page
`/protected/files/[id]` — **sans upload/suppression/admin**, **404 anti-énumération**, URL signée jamais
mise en cache/journalisée). Implémenté (local, non publié) : packages clients. Décidé mais non implémenté :
secure storage mobile, **SSR Auth complet**, **upload/admin Files côté Web**, CI/CD, registry.
Détail : [`IMPLEMENTATION_MATRIX.md`](./IMPLEMENTATION_MATRIX.md).

## 9. Tests

API Core : **377 tests unitaires** (47 suites) + **101 tests e2e** (12 suites, PostgreSQL + MinIO
jetables), couverture disponible. Packages : api-contracts **11**, api-client-fetch **29** (`node:test`),
+ preuve live **16/16** (client officiel vs API réelle). UI Kit : **78 tests** (`node:test` + `global-jsdom`
+ Testing Library + jest-axe, **React 19**), **100 % couverture** (9 primitives, dont Alert/Card/FormField).
Web Core : **307 tests** (`node:test` :
config/URL, clients serveur/public, QueryClient/retry, query keys, transport Health, hooks, **hydratation**,
UI, mapping d'erreurs, garde anti-réseau, **Auth** : cookie-config, session adapter, factory
read-only/writable, **CSRF** (gén/validation temps constant), **Origin/Referer**, validation login, handlers
`csrf`/`login`/`refresh`/`logout`/`me`/`authorization`, isolation A/B, frontières d'import, **sentinelles** ;
**session/autorisations** : client BFF navigateur (envelope, same-origin, 401/403/réseau, aucun token),
`authKeys` disjoints, `useSession` (401→anonymous / 403→error), `useAuthorization` (désactivé en anonyme,
helpers OR/AND sans wildcard), `useLogout` (purge Auth / Health conservé ; échec réseau → pas de purge), UI
session/authorization + a11y ; **Web Auth 4** : résolveur serveur read-only (200/401/403/5xx/réseau/invalide,
isolation, **aucun refresh**, **aucune écriture cookie**), `decideProtectedRender`, **hydratation** (authentifié
au 1ᵉʳ rendu, **0 appel `/me`**, aucun token), vues indisponibilité/notice ; **Web Auth 5** : `sanitizeReturnTo`
(anti open-redirect), validation login, client BFF login (CSRF/body/statuts/**aucune fuite mot de passe**),
`useLogin` (**purge authKeys**, **double-soumission empêchée**, aucun credential en cache), `LoginForm`
(a11y ×4) ; **Files 1** : handlers BFF (UUID **400 sans appel API**, **401/403/404/409/503 distincts**, CSRF/Origin
sur download-url, `no-store`, `requestId`, **aucun champ interne**, read-only **sans refresh**), client BFF Files
(same-origin, `credentials:include`, **aucun Authorization**, **URL absente des erreurs**), `useFileMetadata`
(clé disjointe, désactivée si UUID invalide, 404/503, retry false), `useCreateDownloadUrl` (CSRF→POST, **URL
jamais en cache**, anti-double-clic, 409), `isUuid`/`formatFileSize` (BigInt)/`formatDateTime`/`isSafeDownloadUrl`/
`triggerDownload` (schémas dangereux refusés, ancre nettoyée), `classifyFileError`, vue métadonnées + axe) +
`next build` + **sonde HTTP** + **preuve API réelle** (NestJS + PostgreSQL jetable) : Auth + session
(login → `/me` → `/authorization` → logout → `/me` 401 ; **read-only sans refresh** ; **droits sans nouveau
JWT**), **espace protégé 26/26** et **connexion 22/22** (anonyme `/protected` → **redirection `/login`** ;
`/login` → formulaire ; login BFF → `authenticated` sans token ; authentifié `/login` → redirection hors login ;
**`returnTo` externe → `/protected`** (aucun open redirect) ; logout → `/login` ; 401 sans énumération ; 403 CSRF ;
bundle/HTML sans secret/mot de passe), **et Files (API NestJS + MinIO jetables) 21/21** (upload auto-VALIDATED +
objet → propriétaire `GET /api/files/:id` **200** publics no-store sans champ interne → `download-url` **200**
`{url,expiresAt}` → **téléchargement réel MinIO** (octets == upload, image/png) → sans permission **403** →
**non-propriétaire avec permission → 404** → quarantaine **409** → objet supprimé **503** → logout **401** + page →
`/login` ; **aucun** storageKey/bucket/X-Amz-Signature/credentials en métadonnées, logs ou bundle). Une **CI
minimale** (`.github/workflows/ci.yml`) rejoue désormais la non-régression du monorepo (hors e2e/runtime).

## 10. Preuves

- `OPENAPI_CLIENT_PROOF.md` — preuve `openapi-typescript`/`openapi-fetch` (concluante, **migrée** en
  packages ; code de preuve retiré, voir `cores/api-nestjs/proofs/openapi-client/README.md`).
- `STRUCTURED_LOGGING_COMPATIBILITY_PROOF.md` — compatibilité `nestjs-pino` (repli Pino direct, ADR-040).

## 11. CI/CD

**CI minimale présente** (ADR-013 **partiellement implémenté**) : `.github/workflows/ci.yml` (GitHub Actions,
Node 24, `npm ci`, `permissions: contents:read`, `concurrency`) impose l'ordre de validation **api-contracts →
api-client-fetch → ui-kit → web-nextjs → audit** : `generate:check`, typecheck/lint/build/test, `pack:check`
UI Kit, **build Web indépendant de l'API**, `npm audit` (0 vuln) et **gardes Axios/Zustand absents**
(ADR-011/012). **Aucun secret, aucun Docker, aucune base/stockage, aucun déploiement, aucun registry.**
**Restent** (au-delà de la CI minimale `ci.yml`) : protection de branche, couverture publiée, release/versioning,
déploiement, environnements protégés. **ADR-014 (registry/GHCR) → `PARTIELLEMENT_IMPLEMENTE`** (Cloud Core 5,
ci-dessous : build + push images). Détail : `.github/workflows/README.md`.
Le **Cloud Core 1** (cadrage) gouverne cette CI ; le **Cloud Core 2** ajoute le **niveau 2**
(`api-runtime-ci.yml` : API NestJS contre PostgreSQL + MinIO jetables, migrate deploy, unit + e2e,
openapi:check, build, audit) ; le **Cloud Core 3** ajoute le **niveau 3** (`web-e2e-ci.yml` : **E2E navigateur**
sur stack réelle API + PostgreSQL + MinIO + Web + **Playwright/Chromium** ; parcours **Health/Auth/Files** ;
utilisateurs + fichier VALIDATED éphémères ; `APP_ENV=development` pour cookies HTTP). **Valeurs de test
jetables**, **aucun secret GitHub**, données éphémères, traces `retain-on-failure` (**aucun artefact poussé**).
Le **Cloud Core 5** ajoute le **niveau 4 partiel** (`registry-ci.yml` + **Dockerfiles** API/Web multi-stage
non-root, Web **standalone**) : build des images + **push GHCR sur `main`** (tags immuables `sha-`/`main-`,
**pas de `latest`**, labels OCI, auth `GITHUB_TOKEN`, **aucun secret/PAT/`.env`**) — **sans déploiement**.
**Politique CI à 4 niveaux** : 1–3 présents, **4 partiel** (registry ; déploiement futur). Le **Cloud Core 4** a figé les
**7 checks** à rendre bloquants sur `main` (= `name:` des jobs) et tranché les politiques artefacts/couverture/
pinning ; la protection de branche `main` reste une **action humaine manuelle**. Enfin le **Cloud Core 5** a
livré la **registry GHCR** (niveau 4 partiel) : `registry-ci.yml` + Dockerfiles API/Web (multi-stage, non-root,
Web standalone) → build + **push images sur `main`** (tags immuables, labels OCI, `GITHUB_TOKEN`, **sans
déploiement/secret/PAT**) — `docker build` API+Web **validé localement**, ADR-014 → `PARTIELLEMENT_IMPLEMENTE`.
Puis le **Cloud Core 6 — déploiement staging manuel** a livré le **cadrage** staging (`cores/cloud/staging/` :
compose+`.env` exemples validés `docker compose config` + runbooks **déploiement/rollback**) — `CADRE_MANUEL_DOCUMENTE`,
**aucune exécution réelle/secret/automatisation/`latest`** ; **CC5B validé** (images GHCR publiques). Enfin le
**Cloud Core 7 — préparation serveur staging & dry-run contrôlé** a **exécuté un dry-run local réel** (images
GHCR immuables `sha-7b07e5e` + `.env.staging` **réel hors dépôt**, secrets jetables supprimés) :
`compose config`/`pull` OK, `postgres`+`minio`+bucket, **image Web boote (HTTP 200)** — **mais l'image API
crash-loop** (query engine Prisma **OpenSSL 1.1.x** dans `.prisma/client` vs runtime **Debian bookworm 3.0.x**),
défaut **invisible à la CI** (runtime de l'image jamais exécuté). Enfin le **Cloud Core 8 — correction de l'image
runtime API** a **corrigé et re-validé** ce défaut : `binaryTargets=["native","debian-openssl-3.0.x"]` (schéma)
+ `openssl` au stage build (Dockerfile) → moteur **3.0.x** dans `.prisma/client` ; **re-validation réelle**
(image + moteur 3.0.x) : **migrations depuis l'image** (offline, 5 appliquées), API **`healthy`** `/health/live`
& `/health/ready` **200**, Web **200**, **stack staging complète healthy** ; **angle mort CI fermé** par le job
**`api-smoke`** (`registry-ci.yml` : lance l'image, vérifie le chargement du moteur Prisma → **gate du push**).
Déploiement staging → **`DRY_RUN_API_IMAGE_FIXED`** ; **stratégie migrations** tranchée = **Option A (depuis
l'image)** ; décision **MinIO/URL signée** = Option A. Détail : `cores/cloud/docs/STAGING_DRY_RUN_REPORT.md` §8.
⚠️ L'**image GHCR corrigée** est **publiée par la registry CI au merge CC8** (`sha-d1e6242`, vérifiée CC8B/8C ;
tags antérieurs cassés). Enfin le **Cloud Core 9 — exécution staging contrôlée** a **exécuté réellement la stack**
(API+Web+PostgreSQL+MinIO) avec les **images corrigées** `sha-d1e6242`, en environnement **Type D : local, sans
exposition publique** (aucun serveur distant/SSH/DNS/HTTPS) : `compose config` valide (no `latest`), **migrations
depuis l'image** (offline), **API & Web `healthy`**, `/health/live`+`/health/ready`+`/`+`/login` = **200**,
**endpoint MinIO Option A joignable** par l'hôte ; ⚠️ **non validé** : **URL signée** bout-en-bout (presign API
non exercé ; `mc` → 403) et **Auth/Files** applicatifs (**aucun utilisateur staging** — seed bloqué). Statut
staging → **`EXECUTION_LOCALE_CONTROLEE`** (détail : `cores/cloud/docs/STAGING_EXECUTION_REPORT.md`). Enfin, une
**revue stratégique d'alignement** (`docs/project-status/ROADMAP_ALIGNMENT_REVIEW.md`) a constaté que la séquence
**Cloud Core 1→9** (CI = V2, registry/staging = V3/VF) a **dépassé l'ordre roadmap** alors que **Mobile Core RN —
priorité #2 V1 — n'a jamais été démarré** → **décision : Cloud Core en PAUSE contrôlée** (CC10 serveur réel
**reporté** — dépendance externe), **retour aux priorités V1**. **Mobile Core RN 1 (starter, #11 mergé)**, **RN 2 — auth/session hardening**, **RN 3 — forms/validation/offline**
**RN 4/4B — client officiel + pont 401**, **RN 5 — server-state**, **RN 6 — état local UI + purge logout**,
**RN 7 — primitives d'upload sécurisé multipart**, **RN 8 — logger/observabilité client (avec redaction)**,
**RN 9 — permissions natives génériques gouvernées**, **RN 10 — notifications locales génériques**,
**RN 11 — i18n / localisation primitives génériques**, **RN 12 — deep-linking / routing primitives génériques**,
**RN 13 — analytics / télémétrie primitives génériques (avec redaction, sans SDK réel)**, **RN 14 — accessibilité (a11y)
primitives génériques**, **RN 15 — app lifecycle primitives génériques**, **RN 16 — connectivité réseau (network
status) primitives génériques**, **RN 17 — feature flags / config primitives génériques**, **RN 18 — gate biométrique
local primitives génériques**, **RN 19 — crash / error-reporting primitives génériques (seam, sans SDK réel)**, **RN 20 —
préférences non sensibles persistantes primitives génériques (seam, sans MMKV/AsyncStorage réel)**, **RN 21 —
consentement télémétrie / privacy gate primitives génériques**, puis **RN 22 — environnement / métadonnées app primitives
génériques non identifiantes (seam, sans `expo-application`/`expo-device` réel) RÉALISÉ** (`mobile-react-native` →
**APP_ENVIRONMENT_READY** ; **ajoute `src/app-environment`** — contexte technique **coarse et NON identifiant** destiné à
être attaché **plus tard** aux télémétries (analytics RN 13 / crash RN 19) **une fois gaté par le consentement RN 21** ;
RN 22 **ne câble pas** analytics/crash et **ne consulte pas RN 21 directement** ; ajouts : `AppEnvironmentSnapshot`
**borné, allow-list stricte** (`os` `ios`/`android`/`web`/`unknown` + `osVersionMajor?` **version majeure seulement** +
`appVersion?`/`buildNumber?`/`buildChannel?`/`locale?`/`environment?` `local`/`development`/`staging`/`production`/`test`) ;
normalizers **tolérants** (`normalizeOs`, **`normalizeMajorVersion`** `17.5.1`→`17` borné, `normalizeAppVersion`/
`normalizeBuildNumber` allow-listés bornés, `normalizeBuildChannel` slug, `normalizeRuntimeEnvironment`, **`normalizeLocaleField`**
réutilise **`normalizeLocale` i18n** sans cycle) ; **`sanitizeAppEnvironmentSnapshot`** ne lit **QUE** les clés autorisées
→ tout champ identifiant d'un input brut (`deviceId`/`idfa`/`androidId`/`installationId`/`pushToken`/`serial`/`model`/`ip`)
**droppé** ; objet **gelé** ; `describeAppEnvironmentForLog` → **champs grossiers seulement** ; `AppEnvironmentAdapter`
(seam **synchrone** `expo-application`/`expo-device`) + **`AppEnvironmentAdapterError`** contrôlé + **placeholder** mémoire
(**copies défensives**, strippe les identifiants seedés) + `createAppEnvironmentService({adapter, logger?})`
(`getSnapshot`/`describeForContext` ; **best-effort non-intrusif** — adapter qui throw → `{os:'unknown'}` + `warn`, **ne
throw jamais** ; **ne persiste rien** ; **ne collecte rien auto** ; **logs RN 8 sûrs** `{operation}`+champs grossiers —
**jamais d'identifiant/PII/version exacte**)) ; **aucun device/installation/vendor id (IDFA/Android ID/push token/serial/
MAC/IP), aucun modèle précis, aucune PII, aucune collecte auto** ; **320 tests `node --test`**, typecheck/lint/test/doctor
+ `git diff --check` verts ; RN 22 **n'ajoute aucune dépendance**). Cloud Core reste **PAUSE_CONTROLEE**, staging
**EXECUTION_LOCALE_CONTROLEE**. **Prochaine action** : **Mobile Core React Native 23 — presse-papiers (clipboard) sécurisé
primitives génériques (seam, sans `expo-clipboard` réel)** ; **actions humaines** : protection de branche `main` + rendre `api-smoke` requis.

## 12. Documentation

Riche : stratégie, ADR, spécifications, rapports API, READMEs de modules. Ce checkpoint
(`docs/project-status/`) devient la **source de pilotage** ; les rapports API restent la référence
détaillée du API Core.

## 13. Risques

1. ~~Aucun commit Git~~ **RÉSOLU** — historique Git actif ; `main` et `origin/main` sont alignés au merge RN 3
   `574cdcf`. Reste : maintenir le flux PR et les checks requis.
2. **Packages intégrés (public + authentifié)** — UI Kit consommé + `api-client-fetch` **instancié**
   (endpoints publics **et** BFF Auth) par le Web Core ; types Auth dérivés via `SchemaOf<>`. Risque de
   dérive si le contrat évolue sans régénération (mitigé par `generate:check`, non automatisé).
3. **Spécifications sans starter** — `cloud` peut être lu à tort comme implémenté (PARTIEL/PAUSE). `mobile-react-native` dispose d'un socle durci (APP_ENVIRONMENT_READY : auth/session + forms/validation + offline préparatoire + **client officiel + server-state + état local UI + purge logout + primitives upload multipart + logger/redaction + permissions runtime + notifications locales + i18n/localisation + deep-linking/routing + analytics/télémétrie + accessibilité a11y + app lifecycle + connectivité réseau + feature flags/config + gate biométrique local + crash/error-reporting + préférences non sensibles + consentement télémétrie + métadonnées app non identifiantes**) ≠ implémentation complète (V1 partielle : écran/picker d'upload, push distant réel + token device, adaptateurs natifs réels (permissions/notifications/localisation/linking/AccessibilityInfo/AppState/NetInfo/LocalAuthentication/Keychain/MMKV/AsyncStorage/expo-application/expo-device), catalogues métier i18n + routes concrètes, SDK analytics réel, SDK crash réel (Sentry/Crashlytics) + crash handlers globaux (ADR-019), application des props a11y dans des composants, câblage des effets lifecycle, offline sync réelle, source remote-config/local réelle des feature flags, activation biométrique réelle + fallback concret (par projet, documenté — ADR-015 §20/§31), store de préférences natif réel (MMKV/AsyncStorage, ADR-015 §15/§16), SDK télémétrie réel + UI de consentement + câblage du gate dans analytics/crash (ADR-038), câblage du contexte environnement dans les télémétries (après gate consentement), backend d'observabilité — différés).
4. **CI minimale en place** (`.github/workflows/ci.yml`) — non-régression du monorepo automatisée (ordre de
   build imposé, `npm ci`, audit, gardes deps). Risque résiduel : **pas de protection de branche**, pas d'E2E
   navigateur, pas de CI runtime API ; reproductibilité hors-CI (clone local) à documenter.
5. **Strategy Phase 0 partiellement datée** — contexte historique à ne pas confondre avec l'état réel.
6. **Image runtime API — défaut Prisma engine CORRIGÉ (Cloud Core 8)** : le query engine de `.prisma/client`
   était compilé pour **OpenSSL 1.1.x** vs runtime **bookworm 3.0.x** (crash-loop). Corrigé via `binaryTargets`
   (schéma) + `openssl` au stage build → moteur **3.0.x** ; re-validé (stack staging `healthy`). **Angle mort CI
   fermé** (`api-smoke` gate le push). ⚠️ Risque **résiduel** : l'**image GHCR corrigée** n'est republiée
   qu'**au merge CC8** (rebuild local impossible — egress npm) ; les tags ≤ `sha-7b07e5e` restent cassés. À
   faire (humain) : rendre **`api-smoke` requis** sur `main`. Détail : `cores/cloud/docs/STAGING_DRY_RUN_REPORT.md` §8.

## 14. Incohérences

Voir la liste détaillée dans [`IMPLEMENTATION_MATRIX.md`](./IMPLEMENTATION_MATRIX.md) §contradictions
et [`DECISIONS_REGISTER.md`](./DECISIONS_REGISTER.md). Principales : ADR validés non implémentés (UI,
CI/CD, registry, secure storage, cookies, server state) ; packages « officiels » non intégrés ;
`strategy/` Phase 0 vs implémentation réelle ; rapport `OPENAPI_CLIENT_PROOF` référençant un code de
preuve désormais retiré (bannière de migration ajoutée).

## 15. Prochaine étape

Le **Web Core** (`@enistere/web-nextjs`, **`IMPLEMENTATION_PARTIELLE`**) expose désormais les **flux BFF
Auth** (`login`/`refresh`/`logout`/`csrf`) **et l'état de session/autorisations** (`me`/`authorization`
read-only, hooks `useSession`/`useAuthorization`, purge du cache Auth au logout, `403` distinct d'`anonymous`,
helpers OR/AND sans wildcard) — **prouvés contre l'API réelle**. Le **Checkpoint de gouvernance** a été réalisé
([`WEB_CORE_GOVERNANCE_REVIEW.md`](../../cores/web-nextjs/docs/WEB_CORE_GOVERNANCE_REVIEW.md)), **Web Auth 4** a
livré le **layout protégé** (résolution Auth **serveur read-only** Option C + **hydratation**, page `/protected`,
redirection anonyme, indisponibilité), puis **Web Auth 5** la **page de connexion `/login`** : formulaire
accessible, **login BFF** (CSRF, **aucun token**), **`returnTo` interne assaini** (anti open-redirect),
navigation **`replace`/`refresh`**, redirection d'un utilisateur déjà authentifié — **sans middleware, sans
Server Action Auth, sans token en JS** (**263 tests** + preuves API réelles **26/26** + **22/22** ; détails
[`protected-routes.md`](../../cores/web-nextjs/docs/protected-routes.md),
[`login-flow.md`](../../cores/web-nextjs/docs/login-flow.md)). La **Revue globale Auth Web (1 → 5)** a été
**réalisée** (rapport [`WEB_AUTH_V1_REVIEW.md`](../../cores/web-nextjs/docs/WEB_AUTH_V1_REVIEW.md)) — verdict
**`AUTH_WEB_V1_STABLE_WITH_RESERVATIONS`** : socle Auth **sûr et cohérent** (aucune fuite de token, **aucun open
redirect**, session cohérente, contenu privé jamais exposé, droits sans nouveau JWT), **263 tests fiables ×2** +
**runtime 33/33**, **aucun défaut bloquant** ; réserves **opérationnelles** (CI, E2E navigateur,
streaming-redirect, multi-onglets, CSP/HSTS). Puis **Web Core UI 1** a livré les **états UI & composants
structurels** : primitives UI Kit `Alert`/`Card`/`FormField` (**78 tests**) + compositions Web
(`LoadingState`/`EmptyState`/`ErrorState`/`UnauthorizedState`(401)/`ForbiddenState`(403)/`ServiceUnavailableState`/
`PageHeader`, **270 tests**), intégrées (accueil/Health/frontières/Auth), accessibles (axe), **sans donnée
sensible** (détail [`ui-states.md`](../../cores/web-nextjs/docs/ui-states.md)). Enfin **Web Core Files 1** a livré
la **première feature de données** en **lecture seule** : deux **Route Handlers BFF ciblés** (`GET /api/files/:id`,
`POST /api/files/:id/download-url`, jamais un proxy générique ; validation **UUID** → 400 sans appel API ;
**CSRF/Origin** sur download-url ; mapping d'erreurs distinct préservant **404 anti-énumération**/409/503), un
**client BFF navigateur** (aucun Bearer), `fileKeys` **disjoints**, `useFileMetadata` (query) + **`useCreateDownloadUrl`**
(**mutation** : URL signée **consommée puis abandonnée**, jamais en cache/log), téléchargement par **ancre
temporaire** (`https`-only), et une page privée `/protected/files/[id]` réutilisant les états UI — **l'API restant
l'autorité** (permission + ownership), **aucun champ interne** exposé, **sans upload/suppression/admin**
(**307 tests** + **preuve API + MinIO réelle 21/21** ; détail
[`files-read-download.md`](../../cores/web-nextjs/docs/files-read-download.md)). Enfin la **Revue globale Web
Core — incrément V1** a traité l'incrément complet (Health + Auth 1→5 + UI 1 + Files 1) comme **un système
unique** : verdict **`WEB_CORE_V1_INCREMENT_STABLE_WITH_RESERVATIONS`** (rapport
[`WEB_CORE_V1_INCREMENT_REVIEW.md`](../../cores/web-nextjs/docs/WEB_CORE_V1_INCREMENT_REVIEW.md)) — socle **sûr
et cohérent** (aucune fuite de token/URL signée/donnée privée, CSRF + Origin/Referer, **indisponible ≠
anonyme**, 404 anti-énumération, droits dynamiques **sans nouveau JWT**, clés de cache disjointes), **307 tests
fiables ×2** + **runtime réel 49/49** (PostgreSQL + MinIO, parcours critique rejoué ×2, incluant **URL signée
réellement expirée → 403** et **pannes API/MinIO**), **aucun défaut bloquant** ; réserves **opérationnelles**
(CI + ordre de build monorepo, E2E navigateur) et **mineures** (CSP/HSTS, 429, contrastes, cache Files au
logout). **Corrections documentaires seules** (`.env.example` + `SECURITY.md`, zéro comportement). Statuts
**maintenus** `IMPLEMENTATION_PARTIELLE` (un verdict d'incrément n'augmente pas le statut du core ; ni
Tailwind/Radix/shadcn ni bibliothèque exhaustive). Enfin la **CI minimale (ADR-013)** a été **mise en place**
(`.github/workflows/ci.yml`) : non-régression du monorepo (ordre `api-contracts → api-client-fetch → ui-kit →
web-nextjs → audit`, `npm ci` Node 24, `generate:check`, build/lint/test, `npm audit` 0 vuln, gardes
Axios/Zustand) — **sans secret/Docker/registry/déploiement** ; ADR-013 passe **`PARTIELLEMENT_IMPLEMENTE`**.
Enfin le **Cloud Core 1 — cadrage d'exécution CI/CD & environnements** a été **réalisé** (`cores/cloud/docs/` +
`cores/cloud/README.md`) : baseline d'exécution (17 sections), environnements logiques, **checklist de
protection de branche** (manuelle), **politique CI à 4 niveaux**, politiques secrets/registry, plans runtime
API & E2E — **sans déploiement, Docker, registry, secret ni infra réelle**. Cloud Core →
**`CADRAGE_OPERATIONNEL`** (Cloud Core 1). Puis le **Cloud Core 2** a livré la **CI runtime API NestJS**
(niveau 2, `api-runtime-ci.yml`), et le **Cloud Core 3** la **CI E2E navigateur** (niveau 3,
`web-e2e-ci.yml` : stack réelle API + PostgreSQL + MinIO + Web + **Playwright/Chromium** ; parcours
**Health/Auth/Files** ; **sans secret/déploiement/registry** ; validé localement, **7 tests Playwright verts**)
— Cloud Core → **`IMPLEMENTATION_PARTIELLE`** (trois workflows CI niveaux 1–3). Enfin le **Cloud Core 4 —
durcissement CI & gouvernance de branche** (documentaire) a **figé les 7 checks** à rendre bloquants sur `main`
(`api-contracts`/`api-client-fetch`/`ui-kit`/`web-nextjs`/`audit` + `api-runtime` + `web-e2e`) et **tranché les
politiques** : artefacts = aucun upload (Option A), couverture = exécutée non publiée, pinning = `@v4` (SHA
futur), `actionlint` futur — **workflows inchangés, aucun job renommé**. ADR-013 reste **partiel** (niveaux 1–3
+ **protection de branche documentée non appliquée**), ADR-014 **non implémenté**. **Prochaine action (humaine)** :
**appliquer** la protection de branche `main` (`GITHUB_BRANCH_PROTECTION_CHECKLIST.md`) ; **prochaine mission** :
**Cloud Core 5 — Registry GHCR sans déploiement** (niveau 4). Détail : [`NEXT_ACTIONS.md`](./NEXT_ACTIONS.md).

## 16. Règles de mise à jour

Ce fichier est mis à jour **en fin de chaque mission** (voir [`README.md`](./README.md) §protocoles).
Toute affirmation doit être **vérifiable dans le repository**. Ne jamais marquer « validé » sans preuve
(tests/fichiers). Ne jamais confondre spécification, ADR, preuve, package et intégration.
