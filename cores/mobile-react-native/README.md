# Mobile Core React Native — Usable Starter Shell

> Statut : **`IMPLEMENTATION_AVANCEE`** (Mobile Core V1 Readiness Review, 2026-07-13 ; RN35 aligné UI Kit, Android smoke validé, iOS smoke bloqué localement par absence macOS/Xcode)
> Spécification cible : [`CORE_SPECIFICATION.md`](./CORE_SPECIFICATION.md)
> Architecture & décisions : [`ARCHITECTURE.md`](./ARCHITECTURE.md)

Socle mobile **Expo / React Native** générique et réutilisable pour les futures
applications Enistere/Kivvoo/RFashion/Bailo/etc. Ce starter pose une fondation
standardisée et gouvernée. **Il ne contient aucune logique métier.**

## Ce que ce socle fournit (périmètre de la mission)

| Brique | Module | Notes |
|---|---|---|
| Navigation | `app/` (Expo Router) + `src/navigation` | stacks **publique** `(public)` et **authentifiée** `(app)`, gate de redirection, **gardes durcies** (`expired`/`refreshing`), routes `home` + **`settings` protégée**, écran *not-found* |
| **Starter shell / Settings (RN 26)** | `app/(app)/settings.tsx` | Écran Settings générique protégé aligné `strategy/04_ROADMAP_GLOBAL.md` Mobile V1 : section session (statut, refresh, sign out), Preferences/UI (lecture `themePreference` Zustand RN 6 + reset UI), Privacy/Telemetry (statuts consentement via placeholder RN 21 local, **sans wiring global**), Environment (contexte safe RN 22 via placeholder/service, **sans identifiant**), Foundation diagnostics (auth/query/upload/logger/consent/telemetry coordinator/retry). **Aucun réseau, aucun endpoint métier, aucun SDK réel, aucune persistance, aucun retry branché** ; lien depuis Home. |
| **Durcissement runtime starter (RN 27)** | `app/**` + `src/ui/Button.tsx` | Vérification Expo du shell public/protégé/settings et correction d'ergonomie ciblée : boutons full-width bornés avec label réductible, conteneurs Sign-in/Home contraints, lignes Settings wrap-safe. **Aucune nouvelle primitive**, aucun réseau, aucune dépendance, aucun endpoint métier, aucun SDK/adaptateur natif réel, aucun retry branché. `expo export -p ios` réussit ; l'export web est non applicable sans `react-native-web` (dépendance volontairement non ajoutée). |
| **Smoke visuel device/simulateur (RN 28)** | Expo Go + Android Emulator `Pixel_6a` | Exécution réelle du starter sur émulateur Android : écran public sign-in, login via mock auth local temporaire + `adb reverse`, Home protégé, Settings protégé, scroll Settings, retour Home, refresh session et sign out. **Aucune correction code requise** ; aucun endpoint métier, SDK réel, dépendance, retry ou changement Auth/Query. Rapport : [`MOBILE_RN28_VISUAL_SMOKE_REPORT.md`](../../docs/project-status/MOBILE_RN28_VISUAL_SMOKE_REPORT.md). |
| **Smoke runtime local reproductible (RN 29)** | `scripts/smoke-android.js` + `npm run smoke:android` | Script Node stdlib uniquement : préflight `adb`/`npx`/device, mock auth local temporaire sur `127.0.0.1:3000`, `adb reverse`, lancement Expo Android, interaction semi-automatisée par labels UI Android (`uiautomator`) et rapport JSON structuré. Rejoue public sign-in → Home protégé → Settings → scroll diagnostics → retour Home → refresh session → sign out. **Pas un E2E complet** : dépend d'un émulateur/device + Expo Go et ne remplace pas une future décision Detox/Maestro/Appium/Playwright mobile. Aucun backend réel, endpoint métier, SDK/adaptateur natif réel, dépendance, persistance, retry ou changement Auth/Query. |
| **Smoke runtime iOS / parity (RN 30)** | `scripts/smoke-ios.js` + `npm run smoke:ios` | Préflight iOS local sans dépendance : vérifie macOS, `xcrun`, `simctl` et `npx`, écrit un rapport JSON et fournit une procédure prête à exécuter sur macOS/iOS device. Sur l'environnement RN30 (`Linux greenovate`, `xcrun` absent), le statut est **`blocked`** : aucune preuve iOS artificielle n'est créée. Rapport : [`MOBILE_RN30_IOS_SMOKE_PARITY.md`](../../docs/project-status/MOBILE_RN30_IOS_SMOKE_PARITY.md). |
| Auth engine | `src/auth/auth-engine.ts` | **machine d'état framework-agnostique** (no React/RN) : `restoreSession`/`signIn`/`signOut`/`refreshSession`/`clearSession`, **expiration**, **refresh coalescé** |
| Auth shell (React) | `src/auth` | états `loading`/`authenticated`/`unauthenticated`/`refreshing`/`expired` ; `AuthProvider` (binding `useSyncExternalStore`), `signIn`/`signOut`/`restoreSession`/`refreshSession`/`clearSession` ; **`EnistereAuthApi`** (réel) + `MobileAuthSessionAdapter` ; `PlaceholderAuthApi` (repli sans backend) |
| Secure storage | `src/storage` | `SecureStorage` (interface) + `ExpoSecureStorage` (SecureStore) + `InMemorySecureStorage` ; **`SessionStore`** (persiste refresh token + expiry + user, **validation**) ; **access token en mémoire** |
| **API client (officiel)** | `src/api` | **`@enistere/api-client-fetch`** (+ `@enistere/api-contracts`) typé — `createEnistereApiClient` (base URL/timeout, **injection Bearer** via adaptateur de session, erreurs `ApiClientError`). Refresh **possédé par l'AuthEngine** (`enableRefresh:false`) ; **pont 401** `authedRequest`/`withAuthRetry` : `401`→`refreshSession` coalescé→1 retry→purge (RN 4B). **Aucun endpoint métier.** |
| Server state (data layer) | `src/query` | `QueryClient` + `QueryProvider` (TanStack Query) **+ couche générique RN 5** : `createQueryKeys` (clés typées stables), **`useAuthedQuery`/`useAuthedMutation`** (appels authentifiés **via `authedRequest`** — pont 401), `toQueryError` (normalisation UI **sans donnée sensible**), `invalidateScope`/**`purgeServerState`** (purge **déterministe** `await cancelQueries`→`clear`, **câblée au logout** RN 6). **401 jamais retenté ; mutations sans retry ; pas de persistance ; aucun endpoint métier.** |
| **État local UI (RN 6)** | `src/store` | **Zustand** (`useUiStore`) générique, **séparé** du server-state : `themePreference` (enum) + `flags` (booléens) + `reset()`. **Uniquement des primitives UI non sensibles** (le type interdit token/profil/payload serveur) ; **in-memory, sans persistance**. Logique de transition **pure** (`ui-state`). |
| **Upload sécurisé (RN 7)** | `src/upload` | `MobileFile` `{uri,name,type}` + helpers purs (`isMobileFile`, `describeFileForLog` → **`{type,extension}`**, sans `uri` ni nom brut, RN 8, `isAllowedFileType` UX) ; **`useUploadMutation`** (via `useAuthedMutation` → `apiClient.files.upload`, pont 401 `authedRequest`, `FormData` reconstruit au retry). **Mutation** → pas de clé de cache ; **aucun fichier/URL signée/token en cache/log/store** ; validation **backend autoritaire** (ADR-007). **Aucun écran, aucun endpoint métier.** |
| **Logger / observabilité (RN 8)** | `src/logger` | Logger générique typé (`createLogger` : `debug`/`info`/`warn`/`error`, **niveaux**, **sink pluggable**, **horloge injectée**, corrélation `child`/`withRequestId`) ; **redaction centrale** (`redactValue`/`redactString` : tokens, `Authorization`, cookies, JWT, **URL signées**, **chemins device**, **PII/email**) appliquée **avant** tout sink ; `safeErrorFields(QueryError)`. **Aucune persistance, aucun transport réseau, aucun service externe, aucun log de body** (ADR-040). |
| **Permissions natives (RN 9)** | `src/permissions` | Modèle pur `PermissionKind`/`PermissionStatus` + helpers (`normalizePermissionStatus`, `canRequestPermission`, `isPermissionGranted`…) ; `PermissionAdapter` (seam Expo) + **`createPermissionService`** (live `getStatus`/`request`/`ensure`/`openSettings`, **logs sûrs** via logger RN 8, `PermissionAdapterError` contrôlé) ; **adaptateur placeholder** (no native dep) ; hook **`usePermission`** (status/loading/error, **no UI**). **Statut jamais persisté** (ni SecureStore/Zustand/Query) ; **API Core = autorité** (07_SECURITY §6). Prépare picker/upload/notifications, **ne les livre pas**. |
| **Notifications locales (RN 10)** | `src/notifications` | `NotificationMessage` **borné/sûr** (`sanitizeNotificationMessage`, `describeNotificationForLog` **sans contenu**) + `NotificationDeliveryState`/`NotificationTrigger` (`normalizeTrigger`) ; `NotificationAdapter` (seam Expo) + **`createNotificationService`** (gate sur la permission `notifications` RN 9 — **jamais de schedule sans permission usable**, `schedule`/`cancel`/`cancelAll`/`getDelivered`, **logs sûrs** via logger RN 8, `NotificationError` contrôlé) ; **adaptateur placeholder** (no native dep). **LOCAL uniquement** : **aucun push réel**, **aucun token device/FCM/APNs**, **aucun stockage**, **aucune UI**. |
| **i18n / localisation (RN 11)** | `src/i18n` | Modèle de locale (`normalizeLocale` via `Intl`, `getLocaleDirection` ltr/rtl, `resolveLocale`) + **catalogue typé** (`createTranslator` : `t`/`has`/`plural`, **interpolation `{name}`**, **pluralisation `Intl.PluralRules`**, clé inconnue **sans throw**) + **formatters `Intl`** (`formatDate`/`formatNumber`/`formatCurrency` — devise requise, **ne lèvent jamais**) ; `LocaleAdapter` (seam Expo) + **adaptateur placeholder** (no native dep) + **`createLocalization`** (résout locale + catalogue + formatters). **Aucune dépendance** (tout via `Intl`), **aucun réseau/persistance/UI** ; **catalogues métier = projets dérivés**. |
| **Deep-linking / routing (RN 12)** | `src/linking` | Parseur pur (`parseDeepLink`, `decodeSafe`, `normalizeUrl` — custom schemes + `https`, sans `URL` global) + **`resolveLink`** (`LinkResolution` `internal`/`externalBlocked`/`invalid`) : **allowlist stricte** schemes/hosts, **anti-open-redirect** (`//`/`scheme://`/`..`), **params sensibles supprimés**, bornes ; `isInternalRoute` ; **`resolveNotificationLink`** (clé configurable, tap notification RN 10). **Aucun log** (donc aucune query sensible loggée), **aucun stockage** de lien/URL, **aucune dépendance native**, **aucune UI** ; **routes concrètes = projets dérivés**. |
| **Analytics / télémétrie (RN 13)** | `src/analytics` | `AnalyticsEvent` borné aux primitives + **redaction dédiée basée RN 8** (`sanitizeAnalyticsEvent` : `isSensitiveProperty` réutilise `isSensitiveKey` + scrub valeurs via `redactString`, bornes, **sans throw**) ; `AnalyticsAdapter` (track/flush?, **pas de `identify`**) + **`createAnalyticsService`** (track **best-effort non-intrusif**, **logs sûrs** `{eventName,propertyCount}` via logger RN 8 — jamais les valeurs, erreurs adapter **contrôlées**) ; **adaptateur placeholder** mémoire (tests). **Aucun SDK réel** (Sentry/Amplitude/GA/Segment/Firebase/OTel), **aucun réseau/persistance/user-id réel/token** ; SDK réel = **ADR projet dérivé**. |
| **Accessibilité a11y (RN 14)** | `src/a11y` | Props **RN-compatibles** (`buildA11yProps` : `role`/`label`/`hint`/`state`, `normalizeA11yText` borné) + **`A11yState`** normalisé (ADR-010 §16 : `disabled`/`focused`/`pressed`/`invalid` + RN state) avec `mergeA11yState`/`isInteractiveRole` ; **annonce** lecteur d'écran (`sanitizeAnnouncement`, `describeAnnouncementForLog` **sans texte**) ; `A11yAdapter` (announce/focus?/isScreenReaderEnabled?, `A11yAdapterError` contrôlé) + **placeholder** mémoire + **`createA11yService`** (best-effort **non-intrusif**, **logs sûrs** `{length,assertive}` — jamais le texte). **Aucun `AccessibilityInfo` réel**, **aucun provider global**, **aucun stockage/UI** ; props appliquées par les **projets dérivés**. |
| **App lifecycle (RN 15)** | `src/app-lifecycle` | Modèle d'état **`AppLifecycleState`** (`active`/`background`/`inactive`/`unknown`) + helpers purs (`normalizeAppLifecycleState`, `isForeground`/`isBackground`, `isValidTransition`, `nextAppLifecycleState`) ; `AppLifecycleAdapter` (seam RN `AppState` : `getState`/`subscribe`, `AppLifecycleAdapterError` contrôlé) + **placeholder** mémoire + **`createAppLifecycleService`** (`getState`/`subscribe`/`transition`/`dispose`, transitions **validées**, **logs sûrs** `{from,to}` — que des enums, erreurs adapter **contrôlées**, listener **isolé**). **Aucun `AppState` réel**, **aucun provider global**, **aucun stockage/UI/logique métier** ; prépare flush analytics (RN 13) / refresh session foreground / planif notifications (RN 10). |
| **Thème / tokens (RN 33)** | `src/theme` | `ThemeProvider` + `ThemePreferenceProvider` câblé sur `useUiStore.themePreference` + bridge tokens placeholder (light/dark). Préférence `system`/`light`/`dark` sélectionnable depuis Settings, in-memory uniquement. |
| UI primitives | `src/ui` | `Screen`, `Text`, `Button` (token-driven, a11y) |
| **Formulaires / validation** | `src/forms` | **React Hook Form + Zod** : `FormField`/`FormLabel`/`FormError`/`TextInputField` (token-driven, a11y), helpers `validateWith` + mapping erreurs Zod/RHF, resolver. **UX uniquement** (backend = autorité, ADR-003 §18). **Aucun formulaire métier.** |
| **Offline-ready (préparatoire)** | `src/offline` | état réseau **abstrait**, enveloppe de **mutation offline**, **queue mémoire** FIFO (`enqueue`/`dequeue`/`peek`/`clear`). **Sans persistance, sans rejeu auto, sans NetInfo/MMKV/AsyncStorage/SQLite, sans donnée sensible** (ADR-015 §19). |
| **Connectivité réseau (RN 16)** | `src/offline` | **étend** RN 3 : `NetworkConnectionType` borné + `normalizeNetworkStatus`/`normalizeConnectionType` ; `NetworkAdapter` (seam RN NetInfo, `NetworkAdapterError`) + **placeholder** mémoire + **`createNetworkService`** (`getStatus(): NetworkState`/`shouldQueue()`/`subscribe`/`transition`/`dispose`, `changedAt` via horloge injectée, **logs sûrs** `{from,to,type}` enums, erreurs contrôlées, listener isolé). **`shouldQueueMutations` reste l'API canonique** (queue sauf online). **Aucun NetInfo réel/dépendance/offline sync/persistance/donnée sensible.** |
| **Feature flags / config (RN 17)** | `src/config` | **étend** `config` (env) : `FlagValue` (bool/string/number) + `FlagSet` + bornes + `isValidFlagKey`/`normalizeFlagValue`/`sanitizeFlagSet` + getters typés à **défaut sûr** (`getBooleanFlag`/`getStringFlag`/`getNumberFlag`/`getFlagValue`) ; `FlagAdapter` (seam local/remote-config, `FlagAdapterError`) + **placeholder** mémoire + **`createFlagService`** (`getFlag`/`getAll`/`subscribe`/`refresh`/`dispose`, defaults⊕adapter, **logs sûrs** `{count}`, erreurs contrôlées, listener isolé). **Distinct des `flags` UI Zustand RN 6.** **Aucun SDK remote-config réel/réseau/persistance/user targeting/donnée sensible.** |
| **Gate biométrique local (RN 18)** | `src/biometrics` | **disponibilité** normalisée (`available`/`notEnrolled`/`unsupported`/`unknown`) + **type** borné (`fingerprint`/`facial`/`iris`/`unknown`) + **résultat** (`success`/`refused`/`cancelled`/`lockout`/`unavailable`/`error`) ; helpers tolérants (**junk → `unknown`/`error`, jamais `success`**) + objets **gelés** ; `BiometricAdapter` (seam Expo `LocalAuthentication`/Keychain, `BiometricAdapterError`) + **placeholder** mémoire + **`createBiometricService`** (`getAvailability`/`isAvailable`/`authenticate`, **gate sans faux succès** — `unavailable` sans prompt si inutilisable, **logs sûrs** `{availability,type}`/`{outcome}`/`{operation}`). **Gate local d'UX uniquement — ne remplace JAMAIS l'auth serveur** (ADR-015 §20). **Aucun `LocalAuthentication`/Keychain réel, aucun secret/biométrie/résultat stocké ou loggé.** |
| **Crash / error-reporting (RN 19)** | `src/crash-reporting` | `CrashReportEvent` **borné** (`severity`/`source`/`name`/`message`/`stack?`/`context`) **rédigé via la redaction RN 8** (`sanitizeCrashMessage`/**`sanitizeCrashStack`** — chemins device/tokens/URL signées/emails scrubés + cap frames, **jamais de stack brute** ; `sanitizeCrashContext` — clés sensibles → `[Redacted]`, primitives bornées) ; `createCrashReportEvent` (gelé, tolérant) + `describeCrashEventForLog` (**`{severity,source}` seul**) ; `CrashReporterAdapter` (seam Sentry/Crashlytics, `CrashReporterAdapterError`) + **placeholder** mémoire (copies défensives) + **`createCrashReporterService`** (`captureError`/`captureMessage`/`setContext`/`flush`, **best-effort non-intrusif** — sync throw + async reject capturés, **jamais de faux succès**, **logs `{operation,severity,source}`**). **Sans SDK réel/réseau/persistance/batching/crash handler global** ; **ne décide pas ADR-019**. **Aucun token/cookie/URL signée/URI device/PII/body/stack brute/user-id réel.** |
| **Préférences non sensibles (RN 20)** | `src/preferences` | `PreferenceValue` (bool/string/number) + `PreferenceSet` + bornes + `isValidPreferenceKey` (format **+ non sensible**, réutilise `isSensitiveKey`) + `normalizePreferenceValue` + **`isSensitivePreferenceValue`** (string que la redaction RN 8 modifierait) + `sanitizePreferenceSet` + getters typés à **défaut sûr** ; `PreferenceStore` (seam **async** MMKV/AsyncStorage, `PreferenceStoreError`) + **placeholder** mémoire (copies défensives) + **`createPreferenceService`** (`get`/`getBoolean`/`getString`/`getNumber`/`set`/`remove`/`clear`/`getAll`/`subscribe` — **garde les écritures** + **assainit les lectures**, **best-effort** non-intrusif, listener isolé, **logs `{operation,count}`**). **Données NON sensibles persistables uniquement** — distinct de SecureStore (secrets), Zustand RN 6 (UI in-memory) et TanStack Query (server-state). **Aucun MMKV/AsyncStorage réel, aucun secret/token/PII** ; **clé/valeur sensible → drop** (jamais persister un secret masqué). |
| **Consentement télémétrie / privacy gate (RN 21)** | `src/consent` | `ConsentCategory` (`analytics`/`crash`/`performance`/`diagnostics`) + `ConsentStatus` (`granted`/`denied`/`unknown`) + `ConsentSet` ; helpers `normalizeConsentCategory`/`normalizeConsentStatus`/`sanitizeConsentSet`/`isConsentGranted`/**`isTelemetryAllowed`** (**default-deny** — `granted` seul autorise, `unknown`/`denied`/absent/invalide bloquent) ; `ConsentStore` (seam, `ConsentStoreError`) + **`createPreferenceConsentStore`** (persistance **déléguée aux préférences RN 20** sous clés non sensibles `privacy.consent.*`, `clear()` ne touche que ces clés) + **placeholder** mémoire (copies défensives) + **`createConsentService`** (`get`/`set`/`isAllowed`/`getAll`/`clear`/`subscribe`, **best-effort** — store défaillant → non autorisé, listener isolé, **logs `{operation,category,status}`/`{operation,count}`**). **Gate à consulter AVANT émission** (analytics RN 13 / crash RN 19) ; **sans SDK réel/réseau/UI/identifiant/PII** ; **ne décide pas ADR-038**, **ne câble pas** analytics/crash. |
| **Environnement / métadonnées app (RN 22)** | `src/app-environment` | `AppEnvironmentSnapshot` **borné, allow-list stricte, non identifiant** (`os` ios/android/web/unknown + `osVersionMajor` **majeur seulement** + `appVersion`/`buildNumber`/`buildChannel`/`locale`/`environment`) ; normalizers tolérants (`normalizeOs`/**`normalizeMajorVersion`** `17.5.1`→`17`/`normalizeAppVersion`/`normalizeBuildChannel`/`normalizeRuntimeEnvironment`/`normalizeLocaleField` via i18n) + **`sanitizeAppEnvironmentSnapshot`** (lit **uniquement** les clés autorisées → **drop** deviceId/IDFA/AndroidID/pushToken/serial/model/IP) + `describeAppEnvironmentForLog` (champs grossiers) ; `AppEnvironmentAdapter` (seam `expo-application`/`expo-device`, `AppEnvironmentAdapterError`) + **placeholder** mémoire (copies défensives) + **`createAppEnvironmentService`** (`getSnapshot`/`describeForContext`, **best-effort** — adapter défaillant → `{os:unknown}`, **ne persiste rien**, **logs `{operation}`+grossiers**). **Contexte sûr pour analytics RN 13 / crash RN 19 — gaté par le consentement RN 21** ; **sans `expo-device`/`expo-application` réel/réseau/identifiant device/PII/collecte auto**. |
| **Presse-papiers sécurisé (RN 23)** | `src/clipboard` | `ClipboardSensitivity` (`normal`/`sensitive`) + `ClipboardOperationResult` (`success`/`unavailable`/`rejected`/`error`) ; `normalizeClipboardText` (borné) + **`isSensitiveClipboardText`** (réutilise la **redaction RN 8** : Bearer/JWT/email/URL signée/URI `file`/`content` → sensible) + `describeClipboardTextForLog` (**`{length,sensitivity}` seul**, jamais le contenu) ; `ClipboardAdapter` (seam `expo-clipboard` : `setString`/`getString?`/`hasString?`/`clear?`, `ClipboardAdapterError`) + **placeholder** mémoire (slot transitoire) + **`createClipboardService`** (`copy`/`getString`/`hasString`/`clear`). **Politique** : `copy` **refuse** un texte sensible (`rejected`, adapter non appelé) sauf `allowSensitive:true` ; **`getString` opt-in explicite** (valeur sensible renvoyée à l'appelant mais **jamais loggée**) ; **`clear` no-op sûr** si absent ; **best-effort** (adapter throw → `error`). **Aucun log de contenu** ; **clipboard non stocké** (pas de preferences/Zustand/Query/SecureStore) ; **sans `expo-clipboard` réel/réseau/persistance/UI/lecture auto**. |
| **Retry / backoff (RN 24)** | `src/retry` | `RetryPolicy` **bornée** (`maxAttempts` **inclut l'appel initial** + `baseDelayMs`/`maxDelayMs`/`factor`/`jitter`) + `normalizeRetryPolicy` (clampe, junk → défauts) ; **`computeBackoffDelay(attempt, policy, rng?)`** (exponentiel **borné** + **jitter déterministe via `rng` injecté**, **aucune horloge globale/`Math.random()`**) ; **`isRetryableError`/`getRetryDecision`** (structurel duck-typing, **sans import ESM** ; retryable network/timeout/408/429/5xx, non retryable 4xx/401/403/session-expired/inconnu ; raison **enum sûre**) + `isAuthOwnedError` ; **`withRetry(fn, policy, {sleep, rng, shouldRetry?, logger?})`** (**`sleep` injecté**, **blocage dur 401/403/session** qu'aucun `shouldRetry` ne contourne, **propage l'erreur originale finale**, **logs `{attempt,delayMs}` seuls**). **Purs/déterministes** ; **ne modifient AUCUN chemin existant** (pont 401 RN 4B + QueryClient RN 5 inchangés, propriétaires du 401) ; **sans dépendance/réseau réel/`Date.now()` testé**. |
| **Coordinateur télémétrie opt-in (RN 25)** | `src/telemetry` | `TelemetryContext` **borné** construit depuis `AppEnvironmentSnapshot` RN 22 (`buildTelemetryContext`/`createTelemetryContext`) et `describeTelemetryContextForLog` → `{fieldCount}` + enums grossiers seulement ; gate pur `getTelemetryConsentDecision`/`isTelemetryCategoryAllowed` sur le service RN 21 (**default-deny**) ; **`createTelemetryCoordinator({ consent, environment, analytics?, crash?, logger? })`** expose `track`, `captureError`, `captureMessage` **uniquement sur appel explicite**. Analytics est émis seulement si consentement `analytics` granted ; crash seulement si `crash` granted ; contexte environnement safe fusionné avant appel aux services RN 13/RN 19 ; **no-op contrôlé** si consentement unknown/denied ou service absent ; erreurs adapter capturées ; logs sûrs `{operation,category,allowed}` uniquement. **Aucun SDK réel, réseau, persistance, identify/user-id, émission au démarrage, ni usage RN 24 retry** ; ne décide pas ADR-038/ADR-019/ADR-018. |
| États standards | `src/states` | `LoadingState`, `ErrorState`, `EmptyState`, `OfflineState`, `UnauthorizedState` |
| Tests | `test/` | **`node --test`** sur le cœur agnostique (… clipboard, retry, **telemetry-context-gate, telemetry-service**) — **355 cas `test(...)`** |

## Stack

- **Expo SDK 55** (New Architecture par défaut), **Expo Router** (routing fichier).
- **React 19.2 / React Native 0.83**.
- **`@enistere/api-client-fetch` + `@enistere/api-contracts`** (client typé officiel ADR-016, sur `openapi-fetch`) — liés via `file:`, résolus par Metro.
- **TanStack Query 5** pour l'état serveur ; **Zustand 5** pour l'état local UI (séparés, ADR-012 / spec §57).
- **React Hook Form 7 + Zod 3** (`@hookform/resolvers`) pour les formulaires et la validation UX.
- **Expo SecureStore** pour les secrets.
- **TypeScript strict**.

## Structure

```txt
cores/mobile-react-native/
├── app/                      # Routes Expo Router (fines)
│   ├── _layout.tsx           # providers (SafeArea → Theme → Query → Auth) + Stack
│   ├── index.tsx             # gate de redirection selon l'état auth
│   ├── (public)/             # navigation publique
│   │   ├── _layout.tsx
│   │   └── sign-in.tsx       # écran placeholder public
│   ├── (app)/                # navigation authentifiée (protégée)
│   │   ├── _layout.tsx       # garde de route
│   │   ├── home.tsx          # écran placeholder authentifié + lien Settings
│   │   └── settings.tsx      # settings/diagnostics génériques protégés (RN 26)
│   └── +not-found.tsx        # fallback
├── src/
│   ├── a11y/                 # accessibilité (agnostiques) : state + props + announcement + adapter + engine + placeholder (RN 14)
│   ├── analytics/            # analytics/télémétrie (agnostiques) : event+redaction (basée RN 8) + adapter + engine + placeholder (RN 13)
│   ├── api/                  # client OFFICIEL @enistere/api-client-fetch (index.ts) + with-auth-retry (pont 401, agnostique)
│   ├── app-environment/      # environnement/métadonnées app (agnostiques) NON identifiantes : model + adapter + placeholder + service — seam expo-application/device (RN 22)
│   ├── app-lifecycle/        # cycle de vie app (agnostiques) : state + adapter + placeholder + engine (RN 15)
│   ├── auth/                 # auth-engine (agnostique), auth-api (seam) + enistere-auth-api (réel) + session-adapter + token-mapping, AuthProvider, hook
│   ├── biometrics/           # gate biométrique local (agnostiques) : model + adapter + placeholder + engine — gate UX, jamais l'auth serveur (RN 18)
│   ├── clipboard/            # presse-papiers sécurisé (agnostiques) : model + adapter + placeholder + service — seam expo-clipboard, aucun log de contenu (RN 23)
│   ├── config/               # env (EXPO_PUBLIC_*) — aucun secret + feature flags génériques (flag-model/adapter/placeholder/service, RN 17)
│   ├── consent/              # consentement télémétrie / privacy gate (agnostiques) : model + store (seam + RN20-backed) + placeholder + service — default-deny, sans SDK (RN 21)
│   ├── crash-reporting/      # crash/error-reporting (agnostiques) : event (rédigé/borné) + adapter + placeholder + engine — sans SDK réel (RN 19)
│   ├── forms/                # RHF + Zod : FormField/FormLabel/FormError/TextInputField + validation/form-errors (agnostiques) + resolver
│   ├── i18n/                 # localisation (agnostiques) : locale + catalog + format (Intl) + adapter + placeholder + engine (RN 11)
│   ├── linking/              # deep-linking/routing (agnostiques) : url (parseDeepLink) + resolve (resolveLink/resolveNotificationLink) (RN 12)
│   ├── logger/               # logger/observabilité (agnostiques) : redaction centrale + createLogger + error-fields (RN 8)
│   ├── navigation/           # constantes de routes + gardes (expired/refreshing)
│   ├── notifications/        # notifications locales (agnostiques) : message + types + engine + placeholder (RN 10)
│   ├── offline/              # offline-ready + connectivité : network-state(+RN16) + network-adapter/placeholder/service + mutation + queue mémoire (agnostiques)
│   ├── permissions/          # permissions runtime (agnostiques) : status + adapter + engine + placeholder + usePermission (RN 9)
│   ├── preferences/          # préférences NON sensibles persistantes (agnostiques) : model + adapter + placeholder + service — seam MMKV/AsyncStorage, sans store réel (RN 20)
│   ├── query/                # server-state : QueryClient/provider + query-keys + query-errors (agnostiques) + useAuthedQuery/Mutation + invalidation
│   ├── states/               # états UI standards
│   ├── store/                # état local UI (Zustand) : ui-state (pur, agnostique) + ui-store (useUiStore)
│   ├── storage/              # SecureStorage (interface) + Expo/InMemory impl + SessionStore
│   ├── telemetry/            # coordinateur télémétrie opt-in : consent RN21 + contexte RN22 + analytics RN13/crash RN19 (RN 25)
│   ├── theme/                # ThemeProvider + tokens (bridge UI Kit)
│   ├── types/                # types génériques partagés
│   ├── ui/                   # primitives UI maison
│   └── upload/               # upload sécurisé : file (pur, agnostique) + useUploadMutation
├── test/                     # node --test (… consent-model, consent-service, consent-preference-store, app-environment-model, app-environment-service, clipboard-model, clipboard-service)
├── app.json · tsconfig.json · tsconfig.test.json · babel.config.js · metro.config.js · eslint.config.js · .env.example
└── CORE_SPECIFICATION.md · README.md · ARCHITECTURE.md
```

> Layout **plat** (projet à la racine du core), cohérent avec `web-nextjs` et
> `api-nestjs`. C'est un écart **assumé** vis-à-vis du `starter/` du
> `CORE_SPECIFICATION.md` §8 — voir [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Gouvernance (ADR appliqués)

| ADR | Application dans ce socle |
|---|---|
| **ADR-003** Validation | **Zod côté client = UX uniquement** ; la validation **backend reste obligatoire** (API Core = autorité) ; aucun DTO API recopié, aucun schéma métier |
| **ADR-004** Auth/session | access token court + refresh token ; logout invalide la session |
| **ADR-007** Fichiers/upload | **upload via l'API** (`apiClient.files.upload` → `POST /files`, RN 7) ; **API = autorité** (taille/MIME/permissions) ; client UX uniquement ; **aucune URL signée/champ interne** exposé ; pas de bypass du stockage |
| **ADR-008** Design tokens | tokens UI Kit = source de vérité ; bridge placeholder en attendant la surface mobile |
| **ADR-010** Stack UI RN | tokens + **ThemeProvider** + composants maison (pas de NativeWind ni lib UI) |
| **ADR-011** Client HTTP | **`fetch` via le client officiel** (`openapi-fetch`, pas d'Axios) ; tokens fournis par la couche auth (adaptateur de session), **jamais** stockés dans le client |
| **ADR-012** Server state | TanStack Query (couche server-state RN 5) **séparé de Zustand** (état local UI, RN 6 — anti-pattern spec §57) ; **cache purgé au logout** (`purgeServerState` **déterministe**, câblé dans `AuthProvider`) ; **`401` jamais retenté** ; mutations sans retry ; pas de persistance |
| **ADR-015** Secure storage | access token **en mémoire** (injecté en Bearer via l'adaptateur), refresh token en **SecureStore** ; **purge au logout** (storage + cache server-state) ; **aucun token/donnée sensible dans Zustand** (store = primitives UI non sensibles) |
| **ADR-016** Client typé OpenAPI | **INTÉGRÉ** : `@enistere/api-client-fetch` + `@enistere/api-contracts` consommés réellement (liés `file:`, Metro) ; refresh possédé par l'AuthEngine (`enableRefresh:false`) — voir ARCHITECTURE §12 |
| **ADR-040** Logging structuré | **logger client (RN 8)** : `createLogger` (niveaux, sink pluggable, corrélation `requestId`) + **redaction centrale** (tokens/`Authorization`/cookies/JWT/URL signées/chemins device/PII) appliquée **avant** tout sink ; **JSON structuré**, **sans transport réseau/persistance/backend d'observabilité** ni log de body — voir ARCHITECTURE §17 |
| **07_SECURITY §6** Autorisation | **permissions runtime (RN 9)** : une permission device est une **capacité locale**, **pas** une barrière de sécurité — l'**API Core reste l'autorité** ; statut **jamais persisté** (ni SecureStore/Zustand/Query) ; logs **sûrs** via le logger RN 8 (`{kind,status}` uniquement) — voir ARCHITECTURE §18 |
| **07_SECURITY §13 / ADR-040** Logs | **notifications locales (RN 10)** : le **contenu** (`title`/`body`/`data`) est potentiellement de la PII → **jamais loggé** (`describeNotificationForLog` = métadonnées seules) ; **aucun token device/push/FCM/APNs** ; **aucun stockage** ; planification **gouvernée** par la permission `notifications` (RN 9) — voir ARCHITECTURE §19 |
| **08_STANDARDS / 06_DEPENDENCY** i18n | **localisation (RN 11)** : primitives génériques **via `Intl` built-in** (**aucune dépendance** ajoutée, pas de framework i18n lourd) ; **aucun réseau**, **aucune persistance de locale**, **aucun contenu métier** (catalogues = projets dérivés) — voir ARCHITECTURE §20 |
| **07_SECURITY §7/§8** Deep-linking | **routing (RN 12)** : **allowlist stricte** schemes/hosts ; **rejet open-redirect** (`//`/`scheme://`/`..`) + URLs externes ; **params sensibles supprimés** ; **aucun log** de query, **aucun stockage** de lien/URL ; parseur **maison** (no native dep) ; routes concrètes = projets dérivés — voir ARCHITECTURE §21 |
| **07_SECURITY §13 / ADR-040** Analytics | **télémétrie (RN 13)** : redaction **basée RN 8** (clés sensibles supprimées + valeurs scrubbées via `redactString`) ; **aucun SDK réel/réseau/persistance**, **aucun user-id réel/token/Authorization/URL signée/URI device** ; logs **sûrs** (`{eventName,propertyCount}` — jamais les valeurs) ; SDK réel = **ADR projet dérivé** — voir ARCHITECTURE §22 |
| **ADR-010 §16 / spec §45** Accessibilité | **a11y (RN 14)** : états **disabled/focused/pressed/invalid** + rôle/label/hint via props RN-compatibles ; **support lecteur d'écran** (annonce bornée) ; **aucun contenu/label/message utilisateur en log** (`describe*ForLog` = métadonnées) ; **aucun stockage**, **aucune dépendance**, **aucun provider global** ; non supposé par une lib externe — voir ARCHITECTURE §23 |
| **02/06 / ADR-040** App lifecycle | **cycle de vie (RN 15)** : modèle d'état normalisé + transitions **validées** ; **aucune donnée utilisateur** (que des enums : `{from,to}`/`{operation}`) ; **aucun `AppState` réel**, **aucune dépendance**, **aucun stockage**, **aucun provider global** ; prépare flush analytics / refresh session / notifications — voir ARCHITECTURE §24 |
| **ADR-015 §19 / 06** Connectivité | **réseau (RN 16)** : **étend `src/offline`** (pas de module concurrent) ; **`shouldQueueMutations` canonique** (queue sauf online) ; `type` borné non identifiant ; **aucun NetInfo réel/dépendance/offline sync/persistance** ; logs **enums seulement** (`{from,to,type}`/`{operation}`) — aucune donnée device/PII — voir ARCHITECTURE §25 |
| **ADR-015 §19/§21 / 06** Feature flags | **config (RN 17)** : un flag = **config** (jamais secret/token/URL signée/PII) ; valeurs **bornées** et **jamais loggées** (`{count}` seulement) ; **aucun SDK remote-config réel/réseau/persistance/user targeting** ; **distinct** des `flags` UI Zustand RN 6 — voir ARCHITECTURE §26 |
| **ADR-015 §20/§21** Biométrie | **gate biométrique local (RN 18)** : **gate d'UX local uniquement** — **ne remplace JAMAIS** login/refresh/session serveur (**API Core = autorité**), reste **optionnel** + **fallback projet**, **aucun faux succès** (device inutilisable → `unavailable` sans prompt) ; **aucun secret/biométrie/résultat/profil stocké** ; logs **enums seulement** (`{availability,type}`/`{outcome}`/`{operation}`) — **jamais le prompt ni la cause native** — voir ARCHITECTURE §27 |
| **ADR-040 §17/§18/§19 · ADR-015 §12/§21/§24** Crash reporting | **crash/error-reporting (RN 19)** : toute donnée passe par la **redaction centrale RN 8** puis est **bornée** (message/stack/context) — **jamais** token/cookie/Authorization/URL signée/URI device/PII/body, **jamais de stack brute** (rédigée + cap frames), **aucun user-id réel** ; **best-effort non-intrusif** (ne casse jamais le flux, jamais de faux succès) ; logs **`{operation,severity,source}` seulement** ; **sans SDK réel** — **ne décide pas ADR-019** — voir ARCHITECTURE §28 |
| **ADR-015 §11/§15/§16/§17/§21 · ADR-012** Préférences | **préférences non sensibles (RN 20)** : couche **persistée NON sensible** distincte de SecureStore (secrets), Zustand RN 6 (UI in-memory) et TanStack Query (server-state) ; **clé sensible refusée** (réutilise `isSensitiveKey`), **valeur sensible droppée** (si `redactString(v) !== v` — jamais persister un secret masqué) ; lectures **assainies** (défense en profondeur) ; **best-effort non-intrusif** ; logs **`{operation,count}` seulement** ; **seam MMKV/AsyncStorage — aucun store natif réel, RN 20 ne décide pas le choix** — voir ARCHITECTURE §29 |
| **ADR-038 · 07_SECURITY** Consentement télémétrie | **consent / privacy gate (RN 21)** : règle **default-deny** (`isAllowed` true **seulement** si `granted` ; `unknown`/`denied`/absent bloquent) ; **gate à consulter AVANT émission** analytics (RN 13) / crash (RN 19) ; persistance **déléguée aux préférences RN 20** (clés non sensibles `privacy.consent.*`) ; **sans SDK réel/réseau/UI/identifiant utilisateur/PII** ; logs **enums/count seulement** ; **ne décide pas ADR-038** et **ne câble pas** analytics/crash — voir ARCHITECTURE §30 |
| **07_SECURITY · ADR-040/ADR-038** Environnement app | **métadonnées app (RN 22)** : snapshot **coarse et NON identifiant** (allow-list stricte ; `osVersion` réduit au **majeur** ; tout `deviceId`/IDFA/AndroidID/`pushToken`/serial/model/IP d'un input brut **droppé**) ; **aucune collecte automatique**, **ne persiste rien** ; **contexte sûr** pour analytics (RN 13)/crash (RN 19) — **le consentement RN 21 reste le gate** ; logs **`{operation}`+champs grossiers** ; **sans `expo-device`/`expo-application` réel** ; **ne décide ni ADR-038/ADR-019/ADR-018** — voir ARCHITECTURE §31 |
| **ADR-040 §17/§18 · ADR-015 §21/§24** Presse-papiers | **clipboard sécurisé (RN 23)** : canal **transitoire/partagé/non fiable** — **aucun log de contenu** copié/collé (métadonnées seules `{length,sensitivity}`) ; un texte **sensible** (Bearer/JWT/email/URL signée/URI device détecté via redaction RN 8, ou `markSensitive`) est **refusé** (`rejected`) sauf `allowSensitive:true` ; **`getString` opt-in explicite** (jamais auto, valeur sensible jamais loggée) ; **clipboard non stocké** (pas de preferences/Zustand/Query/SecureStore) ; **sans `expo-clipboard` réel/réseau/persistance/UI** — voir ARCHITECTURE §32 |

## Commandes

```bash
# Prérequis : les packages liés (file:) doivent être bâtis (dist) une fois, p.ex.
# depuis la racine du monorepo : npm run build  (api-contracts + api-client-fetch)
npm install          # installe les dépendances (core autonome, hors workspaces ; @enistere/* liés en file:)
npm run typecheck    # tsc --noEmit (strict) — contre les types réels du contrat
npm run lint         # expo lint (eslint-config-expo)
npm test             # nettoie build-test, tsc -p tsconfig.test.json && node --test (cœur agnostique)
npm run doctor       # npx expo-doctor
npm run smoke:android # smoke local Android semi-automatisé (adb + Expo Go + mock auth local ; rapport JSON)
npm run smoke:ios    # préflight iOS local (macOS/xcrun/simctl ; rapport JSON, blocked si environnement absent)
npm start            # démarre le serveur de dev Expo
```

## Configuration d'environnement

Seules les variables **`EXPO_PUBLIC_*`** sont exposées au bundle — elles sont
**publiques**. **Aucun secret** ici. Copier [`.env.example`](./.env.example) en
`.env` (gitignoré) :

- `EXPO_PUBLIC_APP_ENV` = `local` | `staging` | `production`
- `EXPO_PUBLIC_API_BASE_URL` = URL de l'API Core (sans slash final)
- `EXPO_PUBLIC_API_TIMEOUT_MS` (optionnel)

## Sécurité

- Aucun secret embarqué ; `EXPO_PUBLIC_*` réservé au public.
- Access token en mémoire ; refresh token en SecureStore ; jamais d'AsyncStorage
  pour les secrets ; **jamais de token, cookie, `Authorization`, URL signée,
  chemin device ou PII dans les logs** — le logger (RN 8) **redacte au centre**
  toute sortie avant le sink (ADR-040 ; `redactValue`/`redactString`).
- Logout : suppression des tokens **et** **purge déterministe** du cache TanStack
  Query (`purgeServerState`, câblée dans `AuthProvider`). **Aucun token/donnée
  sensible dans le store local Zustand** (primitives UI non sensibles uniquement).

## Hors périmètre de cette mission (différé)

**Usage court (RN 25)** : `const telemetry = createTelemetryCoordinator({
consent, environment, analytics, crash })` puis `await telemetry.track({ name:
'screen_view' })` ou `await telemetry.captureError(error)`. Chaque appel consulte
le consentement (`analytics` ou `crash`) ; `unknown`/`denied` bloque sans émission,
`granted` enrichit avec le contexte RN 22 safe avant d'appeler les services RN 13/
RN 19. Le coordinateur n'émet jamais au démarrage, ne persiste rien, ne logge que
`{operation,category,allowed}` et ne branche aucun SDK réel.

**Usage court (RN 23)** : `const clip = createClipboardService({ adapter })` puis
`const { result } = await clip.copy(code)` (refusé `rejected` si sensible sans
`allowSensitive`) ; lecture **explicite** `const text = await clip.getString()` (jamais
loggée) ; `await clip.clear()` après usage sensible. Le contenu **n'est jamais loggé**
et le clipboard (transitoire/non fiable) **n'est jamais persisté**.

**Usage court (RN 26)** : depuis Home, ouvrir Settings pour vérifier le shell V1 :
statut session, refresh/sign out, préférence UI in-memory, consentements placeholder,
contexte environnement safe et diagnostics de primitives. Cet écran est une surface de
démarrage et de diagnostic : il ne lance aucun SDK, ne fait aucun appel réseau et ne
persiste rien.

**Usage court (RN 22)** : `const env = createAppEnvironmentService({ adapter })` puis,
dans un futur adaptateur télémétrie : `if (await consent.isAllowed('crash'))
crash.setContext(env.describeForContext())` — le contexte est **coarse et non
identifiant** (OS + version **majeure** + app/build version + channel + locale +
environnement) ; **aucun identifiant device, aucune PII, aucune collecte auto**, et
**le consentement RN 21 reste le gate**.

**Usage court (RN 21)** : `const consent = createConsentService({ store:
createPreferenceConsentStore(prefs) })` puis, dans un futur adaptateur analytics/
crash : `if (await consent.isAllowed('analytics')) adapter.track(event)` — **gate
default-deny** : `unknown`/`denied`/absent bloquent, seul `granted` autorise. RN 21
**ne câble pas** analytics/crash et **n'émet rien**.

**Usage court (RN 20)** : `const prefs = createPreferenceService({ store })` puis
`await prefs.set('theme', 'dark')` / `const theme = await prefs.getString('theme',
'system')` — **données non sensibles uniquement** (une clé/valeur sensible est
**droppée**, jamais persistée) ; **secrets → SecureStore**, état UI in-memory →
Zustand RN 6, server-state → TanStack Query. L'adaptateur réel (projet dérivé) relaie
MMKV/AsyncStorage **sous ADR-015 §15/§16**.

**Usage court (RN 19)** : `const crash = createCrashReporterService({ adapter, logger })`
puis `try { risky(); } catch (e) { crash.captureError(e, { severity: 'error', context:
{ screen } }); }` — l'événement est **rédigé + borné** (redaction RN 8) avant d'atteindre
l'adaptateur ; l'échec de l'adaptateur reste **interne** (best-effort, ne casse jamais le
flux). L'adaptateur réel (projet dérivé) relaie Sentry/Crashlytics **sous ADR-019**.

**Usage court (RN 18)** : `const bio = createBiometricService({ adapter })` puis
`if (await bio.isAvailable()) { const { outcome } = await bio.authenticate({ reason });
if (outcome === 'success') unlockLocalAction(); else fallbackToPassword(); }` — la
biométrie **gate** une action **locale** ; l'auth serveur (login/refresh/session)
reste **toujours** requise et autoritaire (ADR-015 §20). L'adaptateur réel (projet
dérivé) relaie Expo `LocalAuthentication`/Keychain et **documente** son activation.

**Usage court (RN 17)** : `const flags = createFlagService({ adapter, defaults: {
'feature.newCheckout': false } })` puis `if (flags.getFlag('feature.newCheckout',
false)) {...}` (défaut sûr si absent/mal typé) ; l'adaptateur réel (projet dérivé)
relaie une source locale / remote-config sous ADR.

**Usage court (RN 16)** : `const net = createNetworkService({ adapter })` puis
`if (shouldQueueMutations(net.getStatus())) enqueue(...)` ou `net.subscribe((s) =>
{ if (s.status === 'online') drainQueue(); })` ; l'adaptateur réel (projet dérivé)
relaie RN NetInfo.

**Usage court (RN 15)** : `const lifecycle = createAppLifecycleService({ adapter })`
puis `lifecycle.subscribe((s) => { if (s === 'active') refresh(); if (s ===
'background') flushAnalytics(); })` ; l'adaptateur réel (projet dérivé) relaie RN
`AppState`.

**Usage court (RN 14)** : `const props = buildA11yProps({ role: 'button', label:
'Save', state: { disabled } })` puis `<Pressable {...props} />` ; pour annoncer :
`createA11yService({ adapter }).announce({ message: 'Saved', assertive: false })`.

Présents au `CORE_SPECIFICATION.md` mais **non livrés** dans ce socle, par choix
de mission. **L'app lifecycle (RN 15) livre les primitives** (modèle d'état,
transitions, adapter, service, placeholder) mais **PAS** d'adaptateur RN `AppState`
réel, de hook/provider, ni de **câblage** des effets concrets (flush analytics /
refresh session au foreground / planification notifications) — c'est au projet
dérivé. **L'a11y (RN 14) livre les primitives** (props, état, annonce,
adapter, service, placeholder) mais **PAS** d'adaptateur `AccessibilityInfo`
réel, de hook/provider, d'application des props dans des composants concrets
(projets dérivés / UI Kit), de gestion fine de l'ordre de focus liée au rendu ni
d'audit a11y automatisé (contraste/tailles tactiles relèvent des **tokens UI
Kit**, ADR-008). **L'analytics (RN 13) livre les primitives** (modèle + redaction
basée RN 8, adapter, service, placeholder) mais **PAS** de **SDK réel**
(Sentry/Amplitude/GA/Segment/Firebase/OTel — sous ADR/validation), de transport
réseau/batching, de **consentement** opt-in/out, de `identify`/user-id ni de
crash reporting. **Le deep-linking (RN 12) livre les primitives** (parseur,
`resolveLink`, `resolveNotificationLink`) mais **PAS** d'adaptateur `expo-linking`
réel (récupération de l'URL entrante/initiale), de câblage navigation (Expo
Router) des routes résolues, de **schémas/routes concrets** (projets dérivés) ni
de config app-links Android / universal links iOS. **L'i18n (RN 11) livre les
primitives** (locale, catalogue typé, interpolation/pluralisation, formatters
`Intl`, adapter, placeholder, service)
mais **PAS** d'adaptateur `expo-localization` réel, de **persistance du choix de
locale**, de hook/provider React, d'application RTL à l'UI, de chargement
paresseux des catalogues ni de **catalogues métier** (apportés par les projets
dérivés). **Les notifications (RN 10) livrent les primitives locales** (message
borné, modèle, service gouverné par la permission RN 9, placeholder) mais **PAS**
de **push distant réel** (Expo Push/FCM/APNs), de **token device**, d'adaptateur
`expo-notifications` réel, de handler de tap/routing, de catégories/actions/badges
ni d'écran. **Les permissions (RN 9) livrent l'abstraction** (modèle, adapter,
service, placeholder, `usePermission`) mais **PAS** d'adaptateurs Expo réels
(caméra/médias/notifications/localisation), d'écran ni de demande de permission
contextualisée. **Le logger (RN 8) livre les primitives** (`createLogger`, redaction centrale, `safeErrorFields`) mais **PAS**
de backend d'observabilité, de transport réseau, de persistance de logs ni de
recâblage des `console.*` existants ; la collecte/observabilité relève d'un
ADR/Cloud Core futur (ADR-018/036). **L'upload (RN 7) livre les primitives**
(`MobileFile`, `useUploadMutation`) mais **PAS** d'écran/picker, de progression,
de multi-upload ni de suppression/quarantaine/restauration (présents dans le
package, non câblés).
Et tout V2/V3 (maps, tracking, carousels, bottom sheets, crash reporting).
**Le store local Zustand n'est PAS persisté** (in-memory ; persistance de
préférences non sensibles = option future, ADR-015 §16).
**L'offline reste préparatoire** : `src/offline` fournit les briques (état réseau
abstrait + **couche connectivité RN 16** : adapter/placeholder/service +
normalisation + `type`, alimentant `shouldQueueMutations`) + queue mémoire,
**sans** persistance, **sans** rejeu automatique, **sans** détection de
connectivité **réelle** (pas de NetInfo — adapter placeholder seulement) ni
**sync** réelle (ADR-029 futur). **Le gate biométrique reste un gate d'UX local** :
`src/biometrics` fournit modèle + adapter (seam) + placeholder + service, **sans**
Expo `LocalAuthentication`/Keychain **réel**, **sans** secret/biométrie/résultat
stocké, et **ne remplace jamais** l'authentification serveur (ADR-015 §20 ; chaque
activation réelle = décision documentée par projet dérivé). **Le crash/error-reporting
reste préparatoire** : `src/crash-reporting` fournit modèle (rédigé/borné) + adapter
(seam) + placeholder + service, **sans** SDK réel (Sentry/Crashlytics/Bugsnag), **sans**
réseau/persistance/batching/crash handler global, et **ne décide pas ADR-019**. **Les
préférences restent un seam** : `src/preferences` fournit modèle (borné, garde
anti-secret) + store (seam) + placeholder + service, **sans** MMKV/AsyncStorage **réel**,
**données non sensibles uniquement** (secrets → SecureStore), et **ne décide aucun
stockage natif** (ADR-015 §15/§16). **Le consentement reste un gate préparatoire** :
`src/consent` fournit modèle + store (seam + RN20-backed) + placeholder + service
**default-deny**, **sans** SDK/réseau/UI/identifiant/PII, **ne câble pas** analytics
(RN 13)/crash (RN 19) et **ne décide pas ADR-038**. **Les métadonnées app restent un
contexte sûr** : `src/app-environment` fournit modèle (borné, allow-list, non
identifiant) + adapter (seam) + placeholder + service, **sans** `expo-device`/
`expo-application` **réel**, **sans** identifiant device/PII/collecte auto, et **ne
décide ni ADR-038/ADR-019/ADR-018** (le consentement RN 21 reste le gate). **Le
presse-papiers reste un seam sécurisé** : `src/clipboard` fournit modèle (borné,
détection de sensibilité via redaction RN 8) + adapter (seam) + placeholder + service
(refus du contenu sensible sans opt-in, **aucun log de contenu**), **sans**
`expo-clipboard` **réel**, **sans** réseau/persistance/UI/lecture auto. **La
télémétrie RN 25 reste opt-in** : `src/telemetry` compose explicitement consentement
RN 21 + contexte RN 22 + services RN 13/RN 19, **sans** SDK réel, réseau,
persistance, identity, émission automatique ni usage du retry RN 24. Voir la roadmap
du spec (§37/§53) et `docs/project-status/NEXT_ACTIONS.md`.

## Vérification

- `typecheck` : ✅ (TypeScript strict, `tsc --noEmit`) — contre les **types réels** du contrat.
- `lint` : ✅ (`expo lint` / eslint-config-expo, 0 finding).
- `test` : ✅ **367 cas `node --test`** (incluant les 13 tests d'alignement tokens RN35).
- `doctor` : ✅ **expo-doctor 19/19** — alignement patch RN 34 : `expo` 55.0.26→55.0.27, `expo-linking` 55.0.15→55.0.16, `expo-secure-store` 55.0.14→55.0.15. Drift pré-existant depuis RN 30, corrigé.
- **runtime / bundle Expo** : ✅ `expo export -p ios` réussit. ✅ Smoke manuel Android RN 28 via Expo Go documenté dans [`MOBILE_RN28_VISUAL_SMOKE_REPORT.md`](../../docs/project-status/MOBILE_RN28_VISUAL_SMOKE_REPORT.md). ✅ Smoke local reproductible RN 29 via `npm run smoke:android` sur Android Emulator `emulator-5554` : rapport JSON `passed` dans `/tmp/enistere-mobile-rn29-smoke-report.json` et synthèse [`MOBILE_RN29_RUNTIME_SMOKE_AUTOMATION.md`](../../docs/project-status/MOBILE_RN29_RUNTIME_SMOKE_AUTOMATION.md). ⚠️ Smoke runtime iOS bloqué localement : hôte `Linux greenovate`, `xcrun` absent ; `npm run smoke:ios` produit un rapport JSON avec `status: blocked`. ✅ Smoke Android RN34 : `npm run smoke:android` **passed** sur `emulator-5554` (Pixel_6a) — loginCount=1, refreshCount=1, 2026-07-08 ; rapport JSON dans `/tmp/enistere-mobile-rn29-smoke-report.json`. Export web non applicable sans `react-native-web` (dépendance volontairement non ajoutée).

## Prochaine mission recommandée

**Mobile Core RN36 — upload runtime starter proof**
: ajouter une surface protégée générique de diagnostic upload qui réutilise
`useUploadMutation`, RHF/Zod, les états `*View` et le client officiel, puis
prouver le parcours sur Android smoke sans endpoint métier, sans SDK picker natif
non décidé et sans toucher Auth/Query. RN31 reste en attente d'un environnement
macOS/Xcode ou device iOS réel.
