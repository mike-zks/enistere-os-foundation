# DECISIONS_REGISTER.md — Registre de lecture rapide des décisions (ADR)

> **Ne remplace pas les ADR** (`docs/adr/`). Fournit une lecture rapide du **statut d'implémentation**
> de chaque décision validée. Vérifié depuis le repository (2026-07-12).
>
> Statuts d'implémentation : `DECIDE_NON_IMPLEMENTE`, `PARTIELLEMENT_IMPLEMENTE`, `IMPLEMENTE`,
> `IMPLEMENTE_ET_REVU`, `NON_APPLICABLE_ACTUELLEMENT`.

## 1. ADR rédigés et Validés (21)

| ADR | Décision (résumé) | Statut ADR | Statut implémentation | Core | Preuve |
|---|---|---|---|---|---|
| ADR-001 | Monorepo Git hybride | Validé | **PARTIELLEMENT_IMPLEMENTE** | Tous | Structure présente ; historique Git actif ; `main` aligné sur `origin/main` (dernier merge RN 3 `574cdcf`) |
| ADR-002 | ORM = Prisma (vs TypeORM) | Validé | **IMPLEMENTE_ET_REVU** | api-nestjs | schema + 5 migrations + tests |
| ADR-003 | Validation = class-validator/transformer | Validé | **PARTIELLEMENT_IMPLEMENTE** | api/web/mobile | backend OK (class-validator) ; **validation UX cliente mobile livrée** (Mobile RN 3 : **Zod** via RHF — `validateWith` + mapping erreurs, **UX uniquement, backend autoritatif**, aucun DTO recopié, aucun schéma métier) ; client Web Zod à venir |
| ADR-004 | Auth/session multi-client | Validé | **PARTIELLEMENT_IMPLEMENTE** | api/web/mobile | API OK ; **session web BFF opérationnelle** (login/refresh/logout via cookies `HttpOnly`) **+ état de session navigateur** (`me`/`authorization` read-only, `useSession`/`useAuthorization` TanStack Query, **401→anonymous / 403 distinct**, purge au logout) **+ premier layout protégé résolu côté serveur** (read-only, Option C, hydratation, redirection anonyme, indisponibilité ≠ anonyme) — preuve API réelle ; **mobile RN 2** : AuthEngine agnostique, access token mémoire, refresh token SecureStore via `SessionStore`, refresh coalescé, expiration, purge logout |
| ADR-005 | Cookies web + CSRF | Validé | **PARTIELLEMENT_IMPLEMENTE** | api/web | **Flux BFF opérationnels** : login/refresh/logout via Route Handlers, cookies `HttpOnly` (access/refresh, `__Host-` prod), **CSRF double-submit** (cookie+header, temps constant, rotation), **Origin/Referer** (fail-closed) — preuve API réelle. Reste : mutations futures réutilisant systématiquement la protection |
| ADR-006 | RBAC + permissions fines | Validé | **IMPLEMENTE_ET_REVU** | api/web/mobile/ui | RBAC API + `AUTH_RBAC_REVIEW` ; **consommé en lecture côté Web** (`useAuthorization` : helpers OR/AND **sans wildcard** pour l'affichage conditionnel — **l'API reste l'autorité finale** ; changement de droits reflété **sans nouveau JWT**, prouvé). **NB Mobile RN 9** : les **permissions runtime device** (caméra/médias/notifications/localisation, `src/permissions`) sont une **capacité locale OS**, **distincte** du RBAC/autorisation — elles ne donnent aucun droit applicatif ; **l'API Core reste l'autorité** (07_SECURITY §6) |
| ADR-007 | Upload MinIO/S3 + contrats fichiers | Validé | **IMPLEMENTE_ET_REVU** | api/cloud/web/mobile/ui | Files API + `FILES_REVIEW` ; **consommé en LECTURE côté Web** (Web Files 1 : métadonnées **publiques** `GET /api/files/:id` + URL signée courte `POST /api/files/:id/download-url` + téléchargement **direct** depuis le stockage objet, BFF ciblé, **404 anti-énumération**, URL signée **jamais** mise en cache/journalisée, **aucun champ interne** exposé) — preuve API + MinIO réelle ; **upload côté Web livré (Files 2)** ; **suppression côté Web livrée (Files 3 : `DELETE /api/files/:id`, assertDelete, UUID/CSRF avant appel API, 409→NOT_DELETABLE, anti-énumération, Dialog UI Kit 4)** ; admin côté Web différé **+ Mobile (RN 7)** : **primitives d'upload sécurisé multipart** au-dessus du client officiel — descripteur RN `MobileFile {uri,name,type}` (**assignable** au `ReactNativeFileDescriptor` du package) + helpers purs (`isMobileFile`, `describeFileForLog` **sans `uri`**, `isAllowedFileType` **pré-check UX** ; **validation taille/MIME/permissions = backend**, autorité finale), `useUploadMutation` via `useAuthedMutation` → `apiClient.files.upload(file, category, {retryOnAuthRefresh:false})` (**refresh 401 = AuthEngine**, `FormData` reconstruit au retry) ; **mutation → aucune clé de cache**, **aucun fichier/URL signée/token/Authorization** en cache/log/store ; renvoie **uniquement** les métadonnées publiques `PublicStoredFileDto` ; **aucun endpoint métier/écran** |
| ADR-008 | Design tokens UI Kit | Validé | **IMPLEMENTE_ET_REVU** | ui-kit/web/mobile | `@enistere/ui-kit` : tokens + **19 primitives Web** (Button/Input/Label/Text/Spinner/VisuallyHidden + Alert/Card/FormField + Dialog/Select/Toast + Badge/Divider/Skeleton + LoadingState/EmptyState/ErrorState/SuccessState), CSS pilotée par tokens, **181 tests** ; Web Core consomme le UI Kit ; Mobile RN35 prouve l'alignement tokens mobile/web |
| ADR-009 | Stack UI Web (Tailwind/Radix/shadcn) | Validé | **PARTIELLEMENT_IMPLEMENTE** | ui-kit/web | UI Kit **consommé par le Web Core** (CSS `--enistere-*`, classes `enistere-*`) ; primitives ajoutées en **CSS natif tokens** ; **Tailwind/Radix/shadcn TOUJOURS non ajoutés** (différés ; non requis pour les états/composants UI 1) |
| ADR-010 | Stack UI React Native | Validé | **PARTIELLEMENT_IMPLEMENTE** | ui-kit/mobile | **ThemeProvider mobile + composants maison LIVRÉS** (Mobile Core RN 1→3 : `ThemeProvider` light/dark, `Screen`/`Text`/`Button` + primitives form `FormField`/`FormLabel`/`FormError`/`TextInputField`, token-driven, états pressed/disabled/loading/invalid, cible tactile a11y, erreurs en live region — **pas de NativeWind ni lib UI**) ; **Mobile RN35 aligne les tokens mobiles sur le UI Kit** (hex/typographie/radius verbatim, aliases `LoadingView`/`EmptyView`/`ErrorView`, 13 tests d'alignement). **+ Mobile RN 14 — primitives a11y génériques** (§16) : `buildA11yProps`/`A11yState` (états **disabled/focused/pressed/invalid** + RN `accessibilityState`) + annonce lecteur d'écran (`createA11yService`/`A11yAdapter` + placeholder, **logs sûrs** `{length,assertive}` — **aucun contenu/label loggé**) ; **aucun `AccessibilityInfo` réel/provider global/stockage/dépendance** ; props à appliquer par les composants (projets dérivés / UI Kit). **Statut ADR inchangé** : stack RN maison et tokens alignés, mais composants RN avancés/adaptateurs natifs restent projets dérivés |
| ADR-011 | Client HTTP = Fetch (vs Axios) | Validé | **PARTIELLEMENT_IMPLEMENTE** | web/mobile/api | `api-client-fetch` **instancié (public + authentifié + Files lecture)** dans le Web Core (façades `auth.login/refresh/logout/getProfile/getAuthorization` **et** `files.getMetadata/createDownloadUrl` via BFF) **+ clients BFF navigateur** (`fetch` same-origin `/api/auth/*` et `/api/files/*`, sans token), preuve API + MinIO réelle **+ Mobile (RN 1→4)** : **client OFFICIEL `@enistere/api-client-fetch` intégré** (RN 4 ; `createEnistereApiClient`, `openapi-fetch`) — injection token via la couche auth (`MobileAuthSessionAdapter`, **aucun token stocké dans le client**), **`401`→refresh→retry possédé par l'AuthEngine** (`enableRefresh:false`), erreurs `ApiClientError` ; **Axios absent**. Reste : hooks server-state (RN 5) |
| ADR-012 | Server state = TanStack Query | Validé | **PARTIELLEMENT_IMPLEMENTE** | web/mobile | **intégré dans le Web Core** (QueryClient retry borné, provider, keys, hooks Health, SSR/hydratation) **+ server state Auth** (`authKeys` disjoints, `useSession`/`useAuthorization`, `retry:false`, **sans persistance**, **purge au logout** — Health conservé) **+ hydratation serveur du profil** (layout protégé : `prefillSessionQuery`, aucun second `/me`) **+ server state Files** (`fileKeys` **disjoints**, `useFileMetadata` query `retry:false`/`enabled` si UUID ; **URL signée = mutation** `useCreateDownloadUrl` retournant `void` → **jamais** en cache de query/mutation, log ou persistance) **+ Mobile (RN 1→5)** : `QueryClient`/`QueryProvider` (401 jamais retenté, mutations sans retry) **+ couche server-state générique RN 5** (`createQueryKeys` clés stables typées, `useAuthedQuery`/`useAuthedMutation` **via `authedRequest`** = pont 401, `toQueryError` normalisation UI **sans donnée sensible**, `invalidateScope`/`purgeServerState` au logout) — **pas de persistance, aucun endpoint métier**. **+ Mobile RN 6** : **purge logout déterministe câblée** (`AuthProvider` : `await cancelQueries`→`clear` dès `unauthenticated`/`expired`) ; **Zustand** (état local UI) **séparé** du server-state (anti-pattern spec §57 ; garde CI `npm ls zustand` au root inchangée — mobile autonome). **+ Mobile RN 7** : **upload = mutation** `useUploadMutation` (`useAuthedMutation` → `apiClient.files.upload`) → **aucune clé de cache**, résultat transient, **aucun fichier/URL signée/token** en cache/log/store ; `toQueryError` étendu **413/415** (messages UX sûrs). **+ Web Files 3** : `useDeleteFile` = **mutation sans mutationKey**, anti-double-soumission, `onSuccess` → `queryClient.removeQueries(fileKeys.detail(id))`. Reste : autres mutations Web |
| ADR-013 | CI/CD V1 | Validé | **PARTIELLEMENT_IMPLEMENTE** | cloud/api/web/mobile | **Niveau 1** `ci.yml` (non-régression monorepo : ordre `api-contracts → api-client-fetch → ui-kit → web-nextjs → audit`, `npm ci` Node 24, `npm audit` 0 vuln, gardes Axios/Zustand) **+ Niveau 2** `api-runtime-ci.yml` (**runtime API NestJS** : PostgreSQL + MinIO jetables, `prisma migrate deploy`, unit + **e2e**, `openapi:check`, build, audit) **+ Niveau 3** `web-e2e-ci.yml` (**E2E navigateur** : stack réelle API + PostgreSQL + MinIO + Web + **Playwright/Chromium** ; parcours **Health/Auth/Files** ; données éphémères ; valeurs de test jetables, **aucun secret**, `APP_ENV=development`) **+ Niveau 4 partiel** `registry-ci.yml` (`api-smoke`, images GHCR) **+ protection `main` active via GitHub Rulesets** (`protect-main`, PR obligatoire, non-fast-forward/suppression interdits, conversations résolues, 8 checks requis). **Reste** : checks `images` optionnels à rendre requis si décidé, couverture publiée, release/versioning, déploiement, environnements protégés |
| ADR-014 | Registry images | Validé | **PARTIELLEMENT_IMPLEMENTE** | cloud/api/web | **Cloud Core 5** : `.github/workflows/registry-ci.yml` + Dockerfiles API/Web (multi-stage, **non-root**, Web **standalone**) — build images + **push GHCR sur `main`** (`ghcr.io/<owner>/<repo>/{api-nestjs,web-nextjs}`), tags **immuables** (`sha-`/`main-`, **pas de `latest`**), labels OCI, auth `GITHUB_TOKEN` (**pas de PAT/secret**), **aucun `.env` dans l'image**. PR = build **sans push**. **CC8** : défaut runtime image API (query engine Prisma OpenSSL 1.1.x vs bookworm 3.0.x) **CORRIGÉ** (`binaryTargets` + `openssl` au build) ; **angle mort fermé** par le job **`api-smoke`** (lance l'image, vérifie le moteur Prisma) qui **gate le push GHCR**. **Reste** : déploiement, scan/signature/provenance, semver/release ; rendre `api-smoke` requis ; rebuild GHCR image (CI au merge). Guide : `GHCR_REGISTRY_GUIDE.md` ; dry-run/fix : `STAGING_DRY_RUN_REPORT.md` §8 |
| ADR-015 | Stockage mobile sécurisé | Validé | **PARTIELLEMENT_IMPLEMENTE** | mobile/api | **Mobile Core (RN 1→20)** : `SecureStorage` + `ExpoSecureStorage` (SecureStore) ; **access token en mémoire**, **refresh token en SecureStore** via `SessionStore` (validation, fail-soft) ; **purge complète au logout** (storage + **cache server-state, déterministe câblée RN 6**) ; tokens **hors logs** ; **état local Zustand (RN 6) = primitives UI non sensibles uniquement, in-memory, sans token/donnée sensible** (§16/§19) ; **upload (RN 7) = aucun fichier/URI device/URL signée/token en cache, log ou store local** ; **logs (RN 8) = redaction centrale** (`redactValue`/`redactString`) → **aucun token/cookie/URL signée/chemin device/PII** dans un log, **même via un sink custom** ; `describeFileForLog` → `{type,extension}` (plus de nom brut) ; **permissions runtime (RN 9) = statut JAMAIS persisté** (ni SecureStore/Zustand/Query — lu live ; logs `{kind,status}` sûrs uniquement) ; **notifications locales (RN 10) = aucun token device/push/FCM/APNs, aucun stockage, aucun contenu (title/body/data) en log** (`describeNotificationForLog` = métadonnées seules) ; offline (RN 3) = queue mémoire non persistée ; **connectivité réseau (RN 16) = couche générique sur `src/offline`** (adapter NetInfo seam + placeholder + service ; `shouldQueueMutations` canonique ; `type` enum non identifiant ; **aucun NetInfo réel/persistance/offline sync** ; logs `{from,to,type}` sûrs) ; **feature flags / config (RN 17) = config non sensible bornée** (`FlagValue` boolean/string/number, `sanitizeFlagSet`, getters typés à défaut sûr), **distincte des `flags` UI Zustand RN 6** ; **aucun secret/token/URL signée/payload serveur/PII en flag, log ou store** ; **aucun SDK remote-config réel/réseau/persistance/user targeting réel** ; logs `{count}` seuls (**jamais clé ni valeur**) ; **gate biométrique local (RN 18) = primitives génériques `src/biometrics`** (disponibilité/type/outcome normalisés + adapter seam Expo `LocalAuthentication`/Keychain + placeholder + `createBiometricService`) — **gate d'UX local conforme §20** : **ne remplace JAMAIS** login/refresh/session serveur (**API Core = autorité**), reste **optionnel** + **fallback projet**, **aucun faux succès** (device inutilisable → `unavailable` sans prompt) ; **aucun secret/biométrie/résultat/profil stocké** ; **aucun prompt ni cause native loggé** (logs `{availability,type}`/`{outcome}`/`{operation}` seuls) ; **aucun `LocalAuthentication`/Keychain réel** ; **préférences non sensibles persistantes (RN 20) = primitives génériques `src/preferences`** (§15/§16) : `PreferenceValue`/`PreferenceSet` bornés + **garde anti-secret** (`isValidPreferenceKey` rejette toute clé sensible via `isSensitiveKey` ; `isSensitivePreferenceValue` rejette toute valeur string que la redaction RN 8 modifierait) + store **seam async** MMKV/AsyncStorage + placeholder mémoire (copies défensives) + `createPreferenceService` (garde les écritures **clé/valeur sensible → drop**, assainit les lectures, best-effort, logs `{operation,count}` seuls) — **données NON sensibles uniquement** (thème/langue/onboarding/filtres), **distinctes** de SecureStore (secrets), du store Zustand RN 6 (UI in-memory) et de TanStack Query (server-state) ; **aucun MMKV/AsyncStorage réel** (le choix du store natif reste **différé**, par projet — RN 20 ne décide aucun stockage natif). Reste : **adaptateur biométrique réel + activation/fallback par projet (documenté — §20/§31)**, **Keychain réel** selon projet, **store de préférences natif réel délégué aux projets dérivés** (**RN37 — décision formelle** : seam `PreferenceStore` + `createPreferenceService` + gardes + placeholder = livrable Foundation V1 ; MMKV/AsyncStorage = choix de projet per §15/§16 ; rapport `MOBILE_RN37_PREFERENCE_STORE_DECISION.md`), persistance offline + sync (ADR-029) |
| ADR-016 | OpenAPI + clients typés | Validé | **PARTIELLEMENT_IMPLEMENTE** | api/web/mobile | contrat + packages ; **consommés par le Web Core** (types `SchemaOf<>` Health/Auth/Files ; client instancié BFF) **ET par le Mobile Core (RN 4)** : `@enistere/api-client-fetch` + `@enistere/api-contracts` **réellement intégrés** (liés `file:` + Metro, core autonome ; `createEnistereApiClient` + `MobileAuthSessionAdapter` + `EnistereAuthApi` sur `/auth/login`/`/auth/refresh` typés ; bundle Metro prouvé) — **aucun DTO recopié, aucune interface cliente manuelle** (§39). Reste : publication des packages ; adaptateur Angular/Dart futurs |
| ADR-034 | Flutter UI : Material 3 vs composants maison | Validé | **IMPLEMENTE** | ui-kit/mobile-flutter | Décision V3 : Mobile Core Flutter = **Material 3 contrôlé par tokens Enistere + composants maison ciblés**. Material 3 est le moteur Flutter, pas l'identité visuelle autonome. **Mobile Core Flutter 2→11 (2026-07-14)** applique la décision : `ThemeData` Enistere, tokens UI Kit verbatim, auth shell, Dio, upload, SecureStorage, RefreshInterceptor, états UI et formulaire sign-in. `MOBILE_FLUTTER_V1_FINAL_READINESS_DECISION.md` promeut le core à `VALIDE_V1`. |
| ADR-039 | Hachage = Argon2id (vs bcrypt) | Validé | **IMPLEMENTE_ET_REVU** | api-nestjs | `PasswordHasher` + tests |
| ADR-040 | Logging structuré (Pino) | Validé | **IMPLEMENTE_ET_REVU** (api) / **PARTIELLEMENT_IMPLEMENTE** (mobile) | api/cloud/mobile | **API Core** : Pino + `STRUCTURED_LOGGING_COMPATIBILITY_PROOF` + e2e. **+ Mobile Core (RN 8)** : **logger client générique** `createLogger` (`debug`/`info`/`warn`/`error`, **niveaux** `isLevelEnabled`, **sink pluggable** — défaut `consoleSink`, **horloge injectée**, corrélation `child`/`withRequestId` = `requestId` §14) avec **redaction centrale** (§17 : `redactValue`/`redactString` — `Authorization`/cookies/tokens/JWT/`secret`/`apiKey`/**URL signées**/`signature`, **chemins device** `file://`/`content://`, **emails/PII**) appliquée **avant** tout sink ; `safeErrorFields(QueryError)` (corrélation, **sans message/payload**, §18) ; **correctif `describeFileForLog`** → `{type,extension}` (plus de nom brut, §18/§22) ; `Error` sérialisé **sans `stack`** ; **JSON structuré stdout/console**, **aucun transport réseau/persistance/backend d'observabilité** (§24 ; Sentry/Loki/OTel relèvent d'ADR-018/036 / Cloud Core). **Aucune dépendance ajoutée.** **+ Mobile RN 9/10** : permissions (RN 9) et notifications (RN 10) **logguent via ce logger** avec **champs sûrs seulement** — permissions `{kind,status}`, notifications `{id,status,state,count}` — **jamais** de contenu de notification (title/body/data) ni de cause d'erreur sensible (`describeNotificationForLog` = métadonnées). **+ Mobile RN 13** : **analytics/télémétrie** réutilise la **redaction RN 8** (`isSensitiveKey`/`redactString`) pour `sanitizeAnalyticsEvent` (clés sensibles supprimées + valeurs scrubbées) et logge **uniquement** `{eventName,propertyCount}` — **jamais** les valeurs ; **aucun SDK réel/réseau/persistance/user-id réel** (SDK Sentry/Amplitude/… = ADR projet dérivé). **+ Mobile RN 19** : **crash / error-reporting** réutilise la **redaction centrale RN 8** — `CrashReportEvent` **borné** dont `message`/`stack`/`context` sont **rédigés** (`sanitizeCrashMessage`/`sanitizeCrashStack` **jamais de stack brute** + cap frames §19 ; `sanitizeCrashContext` clés sensibles → `[Redacted]`) et logge **uniquement** `{operation,severity,source}` — **jamais** message/stack/context, **jamais** token/URL signée/URI device/PII/body/user-id réel ; service **best-effort non-intrusif** (sync throw + async reject capturés, **jamais de faux succès**) ; **sans SDK réel/réseau/persistance/batching/crash handler global** ; **ne décide PAS ADR-019** (Sentry/Crashlytics = ADR-019, **reste À RÉDIGER**). **+ Mobile RN 21** : **consentement télémétrie / privacy gate** — primitive **préparatoire** `src/consent` (catégories `analytics`/`crash`/`performance`/`diagnostics` × `granted`/`denied`/`unknown` ; **`isTelemetryAllowed` default-deny** — seul `granted` autorise) destinée à **gater** l'émission analytics (RN 13) / crash (RN 19) **avant** tout envoi ; persistance **déléguée aux préférences non sensibles RN 20** (clés `privacy.consent.*`) ; logs `{operation,category,status}`/`{operation,count}` seuls ; **aucun SDK réel/réseau/UI/identifiant/PII** ; **ne décide PAS ADR-038** (analytics produit/consentement/coûts = ADR-038, **reste À RÉDIGER**) et **ne câble pas** analytics/crash. **+ Mobile RN 22** : **environnement / métadonnées app** — primitive **préparatoire** `src/app-environment` fournissant un **contexte technique coarse et NON identifiant** (`os` + version **majeure** + app/build version + channel + locale + environnement) destiné à être attaché **plus tard** aux télémétries (analytics RN 13 / crash RN 19) **une fois gaté par le consentement RN 21** ; **`sanitizeAppEnvironmentSnapshot`** (allow-list stricte) **drop** tout identifiant device/installation (IDFA/Android ID/installation id/serial/MAC/IP/modèle précis) ; logs `{operation}`+champs grossiers seuls ; **ne persiste rien, ne collecte rien auto** ; **aucun `expo-device`/`expo-application` réel/PII** ; **ne décide ni ADR-038/ADR-019/ADR-018**. **+ Mobile RN 23** : **presse-papiers sécurisé** `src/clipboard` — le clipboard est un **canal transitoire/partagé/non fiable** dont le **contenu n'est JAMAIS loggé** (métadonnées seules `{operation,result,sensitivity,length}`) ni persisté ; **`isSensitiveClipboardText`** réutilise la **redaction RN 8** pour classer un texte sensible (Bearer/JWT/email/URL signée/URI device) ; `copy` **refuse** le contenu sensible sans opt-in (`rejected`), `getString` opt-in jamais auto et **jamais loggé** ; **aucun `expo-clipboard` réel/réseau/persistance** ; clipboard **non stocké** dans preferences/Zustand/Query/SecureStore. **+ Mobile RN 24** : **retry/backoff générique** `src/retry` logge uniquement `{attempt,delayMs}` via logger injecté, jamais message/body/url/token ; `getRetryDecision` expose une raison enum sûre ; 401/403/session-expired restent hors retry. Reste : recâbler les `console.*` existants ; collecte/transport côté Cloud Core ; **adaptateur crash réel + ADR-019** ; **SDK télémétrie réel + UI consentement + câblage du gate + du contexte env (ADR-038)** |
| ADR-035 | Angular UI : Angular Material (CDK + M3) contrôlé par tokens Enistere + composants maison | Validé | **DECIDE_NON_IMPLEMENTE** | ui-kit, web-angular | Option D : Angular Material (CDK + Material 3) contrôlé par tokens Enistere (ADR-008) via `mat.define-theme()` / CSS custom properties `--mat-*` + composants maison Enistere Angular ciblés + Reactive Forms obligatoire + `@angular/cdk/testing` + Angular Signals / NgRx différé projet dérivé. Pas de PrimeNG, pas de shadcn/Radix côté Angular. Adaptateur OpenAPI Angular (ADR-016 §F) décidé par preuve dans Web Core Angular. Décision 2026-07-15. |
| ADR-041 | Build system Spring Boot = Maven | Validé | **IMPLEMENTE** | api-spring | `cores/api-spring/pom.xml` (Spring Boot 4.1.0 Parent POM, JJWT 0.12.6, Java 21) + `mvnw`/`mvnw.cmd`/`.mvn/wrapper/` (Maven Wrapper 3.9.12) + CI L5 `api-spring-verify` (`./mvnw verify --no-transfer-progress`, 71/71 ✅ avec Testcontainers PostgreSQL). Gradle autorisé uniquement par exception documentée dans un projet dérivé. |

> **Note RN25 (ADR-038/019/040)** : `src/telemetry` compose désormais explicitement
> consentement RN21 + contexte safe RN22 + analytics RN13/crash RN19 via un
> coordinateur opt-in. Cette couche ne choisit aucun SDK analytics/crash, ne crée
> aucun transport d'observabilité, ne remplace pas l'UI de consentement et ne
> décide pas ADR-038/ADR-019/ADR-018 ; elle renforce seulement l'application
> locale d'ADR-040 par des logs `{operation,category,allowed}`.
>
> **Note RN26 (roadmap Mobile V1)** : le Settings shell protégé aligne le core
> avec `strategy/04_ROADMAP_GLOBAL.md` §9 (settings screen + starter exploitable).
> Il ne crée pas de nouvel ADR : aucun SDK, endpoint métier, adaptateur natif,
> persistance ou politique de retry n'est décidé.
>
> **Note RN27 (runtime starter Expo)** : le durcissement du shell
> public/protégé/settings reste une correction d'ergonomie et de vérification
> runtime. Il ne crée pas de nouvel ADR, n'ajoute aucune dépendance
> (`react-native-web` reste volontairement absent), ne choisit aucun adaptateur
> natif réel et ne modifie pas les décisions Auth/Query/Retry/Telemetry.
>
> **Note RN28 (smoke visuel device/simulateur)** : le smoke Android Emulator du
> starter public/protégé/settings confirme le comportement runtime du shell et
> produit un rapport gouverné. Il ne crée pas de nouvel ADR, n'ajoute aucune
> dépendance, ne choisit aucun SDK/adaptateur natif réel, ne branche aucun retry
> et ne modifie pas Auth/Query/Telemetry. Le mock auth local utilisé est une
> fixture temporaire de smoke, non versionnée et sans endpoint métier.
>
> **Note RN29 (automatisation locale du smoke runtime)** : `npm run
> smoke:android` formalise le smoke Android local en script reproductible, avec
> mock auth temporaire, `adb reverse`, Expo Android, pilotage par labels UI et
> rapport JSON. Cette automatisation ne crée pas de nouvel ADR, n'ajoute aucune
> dépendance et ne décide aucun framework E2E mobile (Detox/Maestro/Appium/
> Playwright mobile ou équivalent). Elle reste une validation runtime locale
> semi-automatisée, sans backend réel, endpoint métier, SDK/adaptateur natif réel,
> persistance, retry branché ni modification Auth/Query/Telemetry.
>
> **Note RN30 (smoke runtime iOS / parity device)** : `npm run smoke:ios`
> formalise un préflight iOS local sans dépendance et documente le blocage
> environnemental courant (hôte Linux sans `xcrun`). RN30 ne crée pas de preuve
> iOS artificielle, ne décide aucun framework E2E mobile ou XCTest custom,
> n'ajoute aucun SDK/adaptateur natif réel, et conserve Android RN28/RN29 comme
> preuves runtime existantes.

## 2. Décisions validées — état d'application

- **ADR-008/009/010** — UI Kit : **ADR-008 implémenté et revu** (tokens + **19 primitives Web**, React 19,
  états UI, consommation Web Core `VALIDE_V1`, cohérence mobile/web prouvée RN35) ; **ADR-009 reste partiel**
  car Tailwind/Radix/shadcn sont volontairement absents ; **ADR-010 mobile FAIT** :
  ThemeProvider + composants maison (Screen/Text/Button + primitives form, token-driven, a11y) — **pas de
  NativeWind**. Restent : composants avancés V2/VF et éventuelle surface RN `@enistere/ui-kit` si décidée.
- **ADR-011 / 012** — **FAIT (Web + Mobile)** : Web — `api-client-fetch` **instancié** (public + **authentifié**
  via BFF) et **TanStack Query** intégré (Health **et** server state Auth — `authKeys` disjoints, `useSession`/
  `useAuthorization`, `retry:false`, sans persistance, **purge au logout**), preuve API réelle. Mobile (RN 1→2) —
  transport `fetch` **seam** (`401`→refresh→retry) + `QueryClient`/`QueryProvider`. Reste : **intégration réelle
  `api-client-fetch` Mobile (RN 4)** ; mutations.
- **ADR-004 / 005 / 006** — **Flux BFF Auth + état de session opérationnels (Web Auth 2 → 3)** :
  `login`/`refresh`/`logout`/`csrf` (cookies `HttpOnly`, CSRF double-submit, Origin/Referer, logout
  idempotent) **et** `me`/`authorization` (read-only, **aucun refresh silencieux**) → `useSession`
  (**401→anonymous / 403 distinct**) + `useAuthorization` (helpers OR/AND **sans wildcard**, ADR-006 ;
  affichage conditionnel, **API = autorité finale** ; **changement de droits sans nouveau JWT** prouvé) —
  **preuve API réelle**. Reste : **SSR Auth complet / routes protégées / middleware** (après checkpoint de
  gouvernance Web Core).

> **Décisions d'implémentation du Web Core (hors ADR, tracées ici)** : **Next.js 16 + React 19** (vs
> Next 14/React 18) — advisories *high* sans correctif en 14.x ; **0 vuln** avec Next 16 + override
> `postcss ^8.5.15`. **UI Kit aligné React 19** (v0.1.1). Runner **node:test** (pas de Vitest). **Build
> via webpack** (`experimental.extensionAlias` résout les imports `.js → .ts/.tsx` ; Turbopack ne le
> fait pas — convention d'import unique `.js`). **TanStack Query v5** ; **aucun store global**, **aucun
> Axios**. Page Health **`force-dynamic` + `no-store`**. **Auth BFF** : access **et** refresh en cookies
> `HttpOnly` (Option A) ; CSRF **double-submit** (cookie non HttpOnly + `X-CSRF-Token`) ; validation login
> **interne** (pas de Zod — déps minimales) ; le client serveur authentifié **bufferise le corps de
> requête** (`fetch(url, init)`) pour éviter `expected non-null body source` sous le `fetch` patché de Next
> sur réponses non-2xx. `server-only` (npm) **non utilisé** (lève sous node:test) → frontière par
> `next/headers` + tests d'import statiques + exclusion `core/auth/server` de node:test. CSP **différée** (V2).
> **Session/autorisations (Web Auth 3)** : `me`/`authorization` en **read-only** (`enableRefresh:false` →
> 401 sur access expiré, **pas de refresh silencieux** sur une lecture) ; **client BFF navigateur**
> same-origin (`/api/auth/*`, `credentials:"include"`) — **jamais** d'appel direct à l'API ni de token lu en
> JS ; cache `authKeys` **disjoint** de `healthKeys`, `retry:false`, **sans persistance** (pas de
> localStorage/sessionStorage) ; **logout = `removeQueries(authKeys.all)`** (Health conservé ; échec réseau →
> pas de purge) ; helpers RBAC **sans wildcard** (paramètre `trim()` seul, codes API canoniques) pour
> l'**affichage conditionnel** uniquement ; **SSR Auth = Option A client-only** (session chargée après
> hydratation, pas d'appel `/me` serveur ; SSR Auth complet différé). Détail de test : les `queryOptions`
> Auth imposent `gcTime` → chaque `QueryClient` de test est `clear()` en `afterEach` (sinon timer GC ref).
>
> **Checkpoint de gouvernance Web Core (2026-06-10)** — revue de socle (rapport permanent
> `cores/web-nextjs/docs/WEB_CORE_GOVERNANCE_REVIEW.md`). Verdict : socle **cohérent et sûr**, **aucune
> dette bloquante**, statut **maintenu** `IMPLEMENTATION_PARTIELLE`. **Orientation SSR Auth tranchée
> (hybride)** : pages **publiques** = **Option A** (client-only, actuelle) ; layouts/pages **privés** =
> **Option C** (résolution Auth **serveur read-only** : Server Component → cookie store read-only → client
> serveur authentifié `read-only` → API `/auth/me` → **hydratation TanStack Query**) — **pas** de self-HTTP
> (Option B rejetée), **pas** de middleware comme autorité (Option D rejetée). **Aucun nouvel ADR requis** :
> couvert par **ADR-004** (session multi-client), **ADR-005** (cookies) et **ADR-012** (server state /
> hydratation) — il s'agit d'une **convention d'implémentation locale**, à confirmer à l'implémentation
> (Web Auth 4) et à promouvoir en ADR seulement si elle devient structurante. **Middleware/proxy** : rôle
> limité au **filtrage UX** (présence de cookie), **jamais** preuve d'authentification/autorisation
> (l'**API reste l'autorité finale**). **Dette IMPORTANTE non bloquante** : l'ordre de build monorepo
> (`packages/*/dist` non versionnés) n'est imposé par aucune CI (ADR-013). Corrections de cette revue :
> **documentaires/factuelles** uniquement (+ suppression de l'export mort `CSRF_HEADER_NAME`), zéro
> changement de comportement (206 tests + build verts).
>
> **Web Auth 4 — résolution Auth serveur + premier layout protégé (implémente ADR-004/005/012, Option C)** :
> le premier **espace privé** résout la session **côté serveur en lecture seule** (`resolveServerSession` →
> client serveur authentifié `read-only`, `enableRefresh:false` → **aucun refresh au rendu**, appel **direct**
> à l'API `/auth/me`, **jamais** le BFF local), retourne un contrat **sans token** (`authenticated|anonymous|
> unavailable` ; `403`/réseau/`5xx`/réponse invalide→unavailable, **jamais** anonyme), puis **hydrate**
> `authKeys.session()` (`prefillSessionQuery`) → `useSession` authentifié au 1ᵉʳ rendu **sans** second `/me`.
> **Défense par le type** : `ReadOnlyServerCookieStore` (get-only) + `guardReadOnly` (lève sur écriture). **Pas
> de middleware**, **pas de self-fetch**, **pas de QueryClient serveur global**. Redirection anonyme interne
> `/?auth=required` (**temporaire** jusqu'à Web Auth 5) ; sous le **streaming** App Router, `redirect()` est
> délivré en 200 via RSC `NEXT_REDIRECT` + meta-refresh (honoré ; **aucune donnée privée** exposée — vérifié).
> Preuve API réelle **26/26**. Détail : `cores/web-nextjs/docs/protected-routes.md`.
>
> **Web Auth 5 — page de connexion & navigation (implémente ADR-004/005/011/012)** : page **publique
> `/login`** (Server Component) qui **assainit** `returnTo` (`sanitizeReturnTo` — **anti open-redirect** :
> chemin interne uniquement, sinon `/protected` ; refuse hôte/schéma externes, `//`/`\`/`..`, contrôle,
> encodages, routes Auth-API), **résout la session côté serveur** (déjà authentifié ⇒ redirige, jamais de
> formulaire). **Login uniquement via le BFF** (`performBffLogin` : CSRF → `POST /api/auth/login`, **aucun
> token lu**). `useLogin` (`useMutation` **sans `mutationKey`** → aucun credential en clé) **purge** `authKeys`
> au succès (Health conservé), **anti-double-soumission** (verrou `useRef` + bouton désactivé) ; navigation
> **`router.replace(returnTo)` + `refresh()`** (la réponse login, sans profil, **ne crée pas** d'état
> authentifié — la session est résolue côté serveur à la navigation). Formulaire **accessible** (labels/
> `aria`/`autoComplete`, `jest-axe`), **mot de passe jamais persisté/journalisé/sérialisé**, erreurs
> **génériques** (401 **sans énumération**). La redirection anonyme du layout protégé pointe vers
> `/login?returnTo=/protected`. **Aucun middleware, aucune Server Action.** Preuve API réelle **22/22**
> (dont open redirect **bloqué** : `returnTo=https://evil…` → cible réelle `/protected`). Détail :
> `cores/web-nextjs/docs/login-flow.md`.
>
> **Revue globale Auth Web (1 → 5)** — verdict **`AUTH_WEB_V1_STABLE_WITH_RESERVATIONS`** (rapport permanent
> `cores/web-nextjs/docs/WEB_AUTH_V1_REVIEW.md`). Le socle Auth Web, traité comme **un système unique** :
> **aucun défaut de sécurité bloquant** (pas de fuite de token source/HTML/RSC/bundle, **aucun open redirect**,
> session cohérente 401→anonymous / 403·5xx·réseau distincts, CSRF complet sur les mutations + Origin/Referer
> fail-closed, contenu privé jamais exposé avant validation, caches isolés/purgés, droits dynamiques **sans
> nouveau JWT**, contrats OpenAPI = source de vérité). **263 tests fiables (×2, sans hang)** + **runtime 33/33**
> (nominal + erreurs + refresh + droits). **Réserves opérationnelles** (non bloquantes) : CI (non-régression +
> ordre de build des paquets), E2E navigateur, redirections en **streaming** (HTTP 200 + `NEXT_REDIRECT`/
> meta-refresh), **multi-onglets** + fenêtre `staleTime`, durcissement **CSP/HSTS/observabilité**. **Aucune
> correction de code applicatif** nécessaire (seul correctif test-only `gcTime` mutation, déjà dans `447e3b5`).
> Statut Web Core **maintenu** `IMPLEMENTATION_PARTIELLE`. Prochaine action : **états UI & composants
> structurels** (pas d'Auth post-V1).
>
> **Web Files 1 — métadonnées & téléchargement sécurisé (consomme ADR-007/011/012/016, lecture seule)** :
> première feature **Files** du Web Core, **sans upload/suppression/admin**. Deux **Route Handlers BFF ciblés**
> (jamais un proxy générique) : `GET /api/files/:id` (métadonnées **publiques**, client serveur **read-only**
> `enableRefresh:false` → 401 sur access expiré **sans refresh** au rendu, `no-store`) et `POST /api/files/:id/
> download-url` (URL signée courte, client serveur **writable** réutilisant le **refresh BFF existant** — aucune
> seconde stratégie Auth —, **Origin/Referer + CSRF** double-submit, `no-store`). **Ordre de garde** : méthode
> (405) → **validation UUID** (`isUuid` → **400 sans appel API**) → [POST : CSRF/Origin → 403 sans appel API] →
> API. **Seul l'UUID du chemin** est accepté (jamais URL/bucket/storageKey/TTL/headers fournis par le client).
> **L'API reste l'autorité** : permissions `files.read`/`files.download` **et** ownership vérifiées côté API ;
> un **non-propriétaire (même avec la permission) → 404** (anti-énumération) ; `useAuthorization` ne sert qu'à
> l'**affichage conditionnel** du bouton. Mapping d'erreurs **distinct** (`files-response.ts`) préservant le
> **404** (vs Auth qui collapse 404→500), **409** (non téléchargeable : statut/visibilité) et **503** (objet
> stockage manquant). **Client BFF navigateur** same-origin (`credentials:"include"`, **aucun Bearer**, ne lit
> aucun token). **TanStack Query** : `fileKeys` **disjoints** ; **l'URL signée est une mutation**
> (`useCreateDownloadUrl` retourne `void`) **consommée immédiatement** (`triggerDownload` : URL `https`-only
> validée → **ancre temporaire** `rel="noopener noreferrer"`) puis **abandonnée** — **jamais** en cache de
> query/mutation, log, erreur, clé ou `localStorage`/`sessionStorage`. **Aucun champ interne** (storageKey/
> bucket/checksum/ownerId) exposé ; `originalName` rendu en **texte** (aucun `dangerouslySetInnerHTML`). Page
> privée `/protected/files/[id]` réutilisant les états UI (UI 1). **Aucun nouveau composant UI Kit, aucun
> middleware, aucun proxy, aucun Server Action.** **307 tests** + **preuve API + MinIO réelle 21/21** (PostgreSQL
> + MinIO jetables ; upload auto-VALIDATED + objet → propriétaire 200 publics no-store sans champ interne →
> download-url 200 `{url,expiresAt}` → **téléchargement réel MinIO** (octets == upload, image/png) → sans
> permission 403 → non-propriétaire avec permission 404 → quarantaine 409 → objet supprimé 503 → logout 401 +
> page → `/login` ; **aucun** storageKey/bucket/X-Amz-Signature/credentials en métadonnées, logs ou bundle).
> **ADR-007 n'est que partiellement consommé côté Web** (lecture/téléchargement uniquement). Statut Web Core
> **maintenu** `IMPLEMENTATION_PARTIELLE`. Détail : `cores/web-nextjs/docs/files-read-download.md`.
>
> **Revue globale Web Core — incrément V1 (2026-06-10)** — revue **transverse de stabilisation** de l'incrément
> complet (Health + Auth 1→5 + UI 1 + Files 1) comme **un système unique**, **sans nouvelle fonctionnalité**
> (rapport permanent `cores/web-nextjs/docs/WEB_CORE_V1_INCREMENT_REVIEW.md`). Vérifié fichier par fichier +
> commandes + **runtime réel** : architecture (couches, aucun import inversé, frontières client/serveur par test
> statique — `next/headers`/server-config/handlers/http Files **interdits côté client**), BFF **ciblé** (jamais
> proxy ; UUID 400 sans appel API ; CSRF/Origin fail-closed avant API ; `no-store`), TanStack Query (clés
> **disjointes** ; **retry borné Health vs `retry:false` Auth/Files** — divergence **intentionnelle** documentée ;
> **URL signée = mutation, jamais en cache/log**), contrats `SchemaOf<>` (`generate:check` ok, décisions sur
> status/errorCode jamais message), erreurs Files distinctes (400/401/403/404/409/429/503/502/504, **404
> préservé**). **Verdict : `WEB_CORE_V1_INCREMENT_STABLE_WITH_RESERVATIONS`** — **aucun défaut bloquant** (pas de
> fuite token/URL signée/donnée privée en source/logs/bundle/RSC ; pas d'open redirect ; CSRF complet ;
> indisponible ≠ anonyme ; 404 anti-énumération ; **droits dynamiques sans nouveau JWT**). **307 tests ×2** +
> **runtime 49/49** (PostgreSQL + MinIO ; critique rejoué ×2 ; incl. **téléchargement réel MinIO**, **URL signée
> réellement expirée → 403**, **pannes API/MinIO**, concurrence). **Réserves** : importantes (**CI + ordre de
> build monorepo**, E2E navigateur) ; mineures (CSP/HSTS, 429 sans `Retry-After`, contrastes non mesurés, cache
> Files non purgé au logout). **Corrections documentaires seules** (`.env.example` +`WEB_ALLOWED_ORIGINS` ;
> `SECURITY.md` routes protégées implémentées + posture Files) — **zéro changement de comportement**. Statut Web
> Core **maintenu** `IMPLEMENTATION_PARTIELLE`. **Prochaine action : CI minimale (ADR-013)** — outiller la
> non-régression avant d'augmenter la surface (Files 2 / UI Kit 4 / Mobile **après** la CI).
- **ADR-015** — secure storage mobile : **PARTIELLEMENT FAIT** (Mobile Core RN 1→3) — `SecureStorage`/
  `ExpoSecureStorage`, **access token en mémoire**, **refresh token SecureStore** via `SessionStore` (validation,
  fail-soft), **purge complète au logout** (storage + cache), tokens hors logs ; offline RN 3 = **queue mémoire
  non persistée, sans donnée sensible** (§19). Reste : biométrie/Keychain/MMKV selon projet, persistance offline (ADR-029).
- **ADR-013** — CI/CD V1 : **première implémentation réelle** (CI minimale `.github/workflows/ci.yml`,
  2026-06-10) — non-régression du monorepo (ordre de build `api-contracts → api-client-fetch → ui-kit →
  web-nextjs → audit`, `npm ci` + Node 24, `permissions: contents:read`, **aucun secret/Docker/registry/
  déploiement**, `npm audit` 0 vuln, gardes Axios/Zustand). **`PARTIELLEMENT_IMPLEMENTE`** : restent protection
  de branche, couverture publiée, E2E navigateur, CI runtime API (PostgreSQL/MinIO), release/versioning,
  déploiement et environnements protégés. **ADR-014** (registry images / GHCR) **non implémenté** — la CI
  minimale ne construit ni ne pousse aucune image. Détail : `.github/workflows/README.md`.
- **Cloud Core 1 — cadrage d'exécution CI/CD & environnements (2026-06-10)** : prolonge ADR-013 **sans**
  déploiement/Docker/registry/secret. Documents (`cores/cloud/docs/`) : `CLOUD_CORE_V1_EXECUTION_BASELINE.md`
  (17 sections), `GITHUB_BRANCH_PROTECTION_CHECKLIST.md` (application **manuelle** dans GitHub Settings, rend
  les 5 checks CI bloquants, force-push/suppression interdits), `SECRETS_POLICY.md` (aucun secret en Git/CI ;
  noms futurs sans valeurs ; jamais en `NEXT_PUBLIC_*` ; GitHub Environments futurs), `REGISTRY_POLICY.md`
  (GHCR cible, tags immuables — **ADR-014 `NON_IMPLEMENTE`**), `API_RUNTIME_CI_PLAN.md` (niveau 2 futur :
  PostgreSQL/MinIO en services, e2e, migrations, openapi:check), `WEB_E2E_CI_PLAN.md` (niveau 3 futur). Statut
  Cloud Core → **`CADRAGE_OPERATIONNEL`** (cadrage gouverné, **aucune** infra réelle ; ne pas confondre avec
  `IMPLEMENTATION_PARTIELLE`). Prochaine action : **Cloud Core 2 — CI runtime API (niveau 2)** + appliquer la
  protection de branche (action humaine manuelle).
- **Cloud Core 2 — CI runtime API NestJS (niveau 2, 2026-06-10)** : implémente le niveau 2. Workflow
  **`.github/workflows/api-runtime-ci.yml`** rejouant l'API Core NestJS (**projet npm autonome**, `npm ci`
  propre, Node 24) contre **PostgreSQL** (`postgres:16`, `services:`) + **MinIO** (`minio/minio` via `docker
  run` — un `services:` ne peut porter `server /data` — + bucket de test) **jetables** : `prisma:generate`/
  `validate`/**`migrate:deploy`** → `lint` → **`npm test`** (unit) → **`test:e2e`** → **`openapi:check`** →
  `build` → `npm audit`. **Valeurs de test jetables** (jamais `secrets.*`, jamais en `.env` versionné), **logs
  sans secret** (`LOG_LEVEL=warn`), données éphémères, **aucun artefact uploadé**, **`ci.yml` (niveau 1)
  inchangé**. **Validé localement par simulation** (mêmes services/env/étapes). Statut Cloud Core →
  **`IMPLEMENTATION_PARTIELLE`** (workflow Cloud runtime réel ; **pas** de registry/déploiement/environnements/
  monitoring/rollback). ADR-013 **reste partiel** (niveaux 1–2) ; **ADR-014 `NON_IMPLEMENTE`**. Prochaine
  action : **Cloud Core 3 — E2E navigateur (niveau 3)** + protection de branche (manuel).
- **Cloud Core 3 — CI E2E navigateur (niveau 3, 2026-06-10)** : implémente le niveau 3. Workflow
  **`.github/workflows/web-e2e-ci.yml`** + suite **Playwright** (`cores/web-nextjs/e2e/`) démarrant une **stack
  réelle éphémère** (PostgreSQL `services:` + MinIO `docker run` + **API NestJS** + **Web Next.js**) et rejouant
  les **parcours navigateur** Chromium headless : **Health** (accueil + sans fuite), **Auth** (anonyme→/login,
  identifiants invalides→erreur générique, login→/protected, **logout**→/login), **Files** (métadonnées sans
  champ interne, **téléchargement** via download-url + requête stockage, id inexistant→introuvable, sans
  permission→accès refusé). Utilisateurs + fichier VALIDATED **éphémères** (`proof-seed-user.ts` +
  `global-setup.ts`) ; **`APP_ENV=development`** (cookies HTTP) ; valeurs de test jetables (jamais `secrets.*`) ;
  traces `retain-on-failure`, **aucun artefact poussé** ; **URL signée jamais journalisée**. E2E **isolés** du
  niveau 1 (`tsconfig`/`eslint` exclus → `typecheck`/`lint`/`build` inchangés). `@playwright/test` ajouté en
  **devDep du workspace Web**. **`ci.yml`/`api-runtime-ci.yml` inchangés.** **Validé localement par simulation**
  (stack réelle + Chromium : **7 tests Playwright verts**). Cloud Core **reste** `IMPLEMENTATION_PARTIELLE`
  (trois workflows CI ; **pas** de registry/déploiement/environnements/monitoring/rollback). ADR-013 **partiel**
  (niveaux 1–3) ; **ADR-014 `NON_IMPLEMENTE`**. Prochaine action : **Cloud Core 4 — durcissement CI &
  protection de branche** (manuel) ; ou niveau 4 (registry/déploiement).
- **Cloud Core 4 — durcissement CI & gouvernance de branche (2026-06-10)** : mission **documentaire**
  (aucun déploiement/registry/secret, **workflows existants inchangés**, **aucun job renommé**). Définit les
  **7 checks** à rendre bloquants sur `main` (= `name:` des jobs : `api-contracts`/`api-client-fetch`/`ui-kit`/
  `web-nextjs`/`audit` + `api-runtime` + `web-e2e`) — `GITHUB_BRANCH_PROTECTION_CHECKLIST.md` enrichi (matrice,
  obligatoires-maintenant vs futurs, avertissement « renommer un job casse l'exigence »). **Décisions
  tranchées** (`CLOUD_CORE_V1_EXECUTION_BASELINE.md` §8 bis) : **artefacts** = aucun upload (Option A ; Option B
  upload-on-failure documentée comme future) ; **couverture** = exécutée, **non publiée** (UI Kit 100 %, Web
  ≈ 87,8 % ; aucun service externe/Codecov) ; **pinning** = `@v4` conservé (SHA = futur, requiert politique de
  MAJ) ; **`actionlint`** = futur (non installé ; validation = parse YAML + simulations). **Validé** : web
  `check` (307) + `npm audit` 0 vuln + YAML des 3 workflows parsé. Cloud Core **reste** `IMPLEMENTATION_PARTIELLE` ;
  ADR-013 **partiel** (niveaux 1–3 + **protection de branche documentée mais non appliquée**) ; ADR-014
  **`NON_IMPLEMENTE`**. **Action humaine en attente** : appliquer la protection de branche. Prochaine mission :
  **Cloud Core 5 — Registry GHCR sans déploiement** (niveau 4). **Note actuelle** : depuis Governance 3,
  la protection `main` est active via GitHub Rulesets (`protect-main`).
- **Cloud Core 5 — Registry GHCR sans déploiement (niveau 4 partiel, 2026-06-10)** : début d'**ADR-014**
  (registry **uniquement**). **Dockerfiles** `cores/api-nestjs/Dockerfile` (contexte `cores/api-nestjs/`,
  multi-stage, `prisma generate` au build, **non-root**, openssl runtime) et `cores/web-nextjs/Dockerfile`
  (contexte **racine**, Next.js **`output: 'standalone'`** + `outputFileTracingRoot` racine, **non-root**) +
  `.dockerignore` (API + racine, **aucun `.env` copié**). **Workflow** `registry-ci.yml` : `permissions:
  contents:read + packages:write` ; **PR → build sans push** ; **push `main` → login GHCR (`GITHUB_TOKEN`) +
  build + push** ; matrice api/web ; `docker/{setup-buildx,login,metadata,build-push}-action` (majeure). **Tags
  immuables** (`docker/metadata-action`, `flavor: latest=false`) : `sha-<short>`, `main-<short>`, `pr-<n>`
  (build seul) — **`latest` jamais généré** ; **labels OCI**. **Aucun secret applicatif, aucun PAT, aucun
  déploiement.** `next.config.ts` modifié (ajout `output:'standalone'` + tracing root — **testé**, niveau 1
  inchangé : 307 tests). **Validé localement** : `docker build` API + Web **OK** + smoke (`node --version`,
  **non-root**, aucun `.env`). ADR-014 → **`PARTIELLEMENT_IMPLEMENTE`** ; ADR-013 reste partiel ; Cloud Core
  reste `IMPLEMENTATION_PARTIELLE`. Workflows existants (1–3) **inchangés**. Prochaine action : **Cloud Core 6 —
  déploiement staging manuel** (ou durcissement registry). **CC5B VALIDÉ** (observation réelle, repo public) :
  Registry CI verte sur `main`, **images GHCR publiques** `api-nestjs`/`web-nextjs` (tags `main-`/`sha-`, **aucun
  `latest`**), checks requis verts (PR #1/#2).
- **Cloud Core 6 — déploiement staging manuel (2026-06-11)** : **cadrage** d'un déploiement staging manuel à
  partir des images GHCR immuables — **aucune exécution réelle, aucun secret, aucune production, aucun `latest`,
  aucune automatisation/workflow deploy**. Livrables : `cores/cloud/staging/docker-compose.staging.example.yml`
  (api+web+postgres+minio, réseau interne, healthchecks, **migrations hors démarrage**, PostgreSQL non exposé,
  MinIO API exposé pour URL signées), `cores/cloud/staging/.env.staging.example` (placeholders ; secrets API
  **non passés** au conteneur Web), `cores/cloud/staging/README.md`, runbooks **`STAGING_DEPLOYMENT_RUNBOOK.md`**
  & **`STAGING_ROLLBACK_RUNBOOK.md`**. **Migrations Prisma découplées de l'image** (runtime sans CLI → `migrate
  deploy` depuis les sources). **Rollback image** simple par tag immuable ; **rollback DB non garanti**
  (migrations additives). **Contrainte URL signée** = hôte `S3_ENDPOINT` joignable navigateur ; **`NEXT_PUBLIC_*`
  figé au build** documenté. **Validé** : `docker compose config` OK (4 services) + **aucun secret API fuité dans
  le conteneur Web**. Statuts **inchangés** (Cloud Core `IMPLEMENTATION_PARTIELLE` ; ADR-013/014 partiels) ;
  **déploiement staging = `CADRE_MANUEL_DOCUMENTE`** (pas `IMPLEMENTE_AUTOMATISE`). `cores/*/src`/`packages`/
  `docs/adr`/`strategy` + Dockerfiles/workflows **non modifiés**. Mergé via **PR #4** (`b001ce8`), **CC6B** mergé
  via **PR #5** (`7b07e5e`). Prochaine action : **Cloud Core 7 — dry-run staging contrôlé**.
- **Cloud Core 7 — préparation serveur staging & dry-run contrôlé (2026-06-11)** : **dry-run local réel** à
  partir des **images GHCR immuables** (`sha-7b07e5e`) + `.env.staging` **réel hors dépôt** (secrets jetables
  `openssl`, **shred** après) — **aucun déploiement réel, aucun secret committé, aucun `latest`, aucun workflow
  deploy**. Résultats (`cores/cloud/docs/STAGING_DRY_RUN_REPORT.md`) : ✅ `docker compose config` valide (tag
  immuable, aucun `latest`), images **tirées en anonyme** (registry public), `postgres healthy` + `minio` +
  bucket, **image Web boote** (HTTP 200, Next 16.2.7) ; ❌ **défaut BLOQUANT** : l'**image API ne démarre pas**
  (crash-loop) — le **query engine** Prisma de `.prisma/client` est compilé pour **OpenSSL 1.1.x** alors que la
  base runtime est **Debian bookworm / OpenSSL 3.0.x** → `/health/ready` jamais vert ; défaut **invisible à la
  CI** (`api-runtime-ci` exécute depuis les **sources** ; `registry-ci` ne fait que **construire** l'image).
  **Corrections** : runbook (l'image **embarque** le CLI Prisma + schema-engine 3.0.x → « CLI absent » **faux** →
  stratégie migrations rouverte) ; **décision MinIO/URL signée tranchée (Option A)** : `S3_ENDPOINT` = adresse
  **publique** du serveur (jamais `minio:9000`), `S3_PUBLIC_ENDPOINT` = évolution future hors V1. **Aucune
  modification** de `cores/*/src`/`packages`/`docs/adr`/`strategy` **ni des Dockerfiles/workflows** (l'image
  n'est **pas** corrigée ici, par périmètre). Statuts **inchangés** (Cloud Core `IMPLEMENTATION_PARTIELLE` ;
  ADR-013/014 partiels) ; **déploiement staging = `DRY_RUN_EXECUTE`** (dry-run exécuté, **défaut bloquant** →
  exécution réelle BLOQUÉE ; pas opérationnel/automatisé). Prochaine action : **Cloud Core 8 — corriger l'image
  runtime API (moteur Prisma)** puis re-dry-run + stratégie migrations.
- **Cloud Core 8 — correction de l'image runtime API NestJS (2026-06-11)** : **corrige** le défaut bloquant CC7
  (image API en crash-loop) et **ferme l'angle mort CI** (image buildée mais jamais exécutée). **Cause** : le
  query engine Prisma de `node_modules/.prisma/client` était compilé pour **OpenSSL 1.1.x** (détection `native`
  ambiguë au stage build sans openssl) alors que la base runtime est **Debian bookworm / OpenSSL 3.0.x**.
  **Correctif** : `prisma/schema.prisma` generator `binaryTargets = ["native", "debian-openssl-3.0.x"]` (force
  l'émission du moteur 3.0.x, copié depuis `@prisma/engines`, **sans réseau**) **+** `Dockerfile` installe
  `openssl`/`ca-certificates` **aussi au stage build**. **Re-validation réelle** (image publiée + moteur 3.0.x
  monté = sortie du fix ; `STAGING_DRY_RUN_REPORT.md` §8) : **migrations depuis l'image** (offline, 5 appliquées),
  API **`Up (healthy)`** `/health/live` & `/health/ready` **200**, Web **200**, **stack staging complète
  healthy**, logs sans erreur moteur. **CI** : `registry-ci.yml` job **`api-smoke`** (build → **lance l'image** →
  vérifie le chargement du moteur Prisma sans DB ; non-root + openssl + moteur présent) → **`images` `needs:
  api-smoke`** ⇒ **push GHCR conditionné au smoke**. **Stratégie migrations** tranchée = **Option A (depuis
  l'image)** (CLI + schema-engine 3.0.x embarqués). **Aucune** modification de la logique métier ;
  `cores/web-nextjs/src`/`ui-kit/src`/`packages`/`docs/adr`/`strategy` **non modifiés** ; **aucun secret/`latest`/
  déploiement**. ⚠️ Le `docker build` **local** est bloqué (egress npm) → l'**image GHCR corrigée** est
  **reconstruite/publiée par la registry CI au merge** (tags ≤ `sha-7b07e5e` restent cassés). Statuts
  **inchangés** (Cloud Core `IMPLEMENTATION_PARTIELLE` ; ADR-013/014 partiels) ; **déploiement staging =
  `DRY_RUN_API_IMAGE_FIXED`**. Mergé via **PR #7** (`d1e6242`) ; post-merge **CC8B/8C** : images corrigées
  publiées (`sha-d1e6242`) et vérifiées. Prochaine action : **Cloud Core 9**.
- **Cloud Core 9 — exécution staging contrôlée (2026-06-11)** : **exécution réelle des conteneurs**
  (API+Web+PostgreSQL+MinIO) à partir des **images GHCR corrigées** (`sha-d1e6242`), en environnement **Type D :
  local, sans exposition publique** (PAS de serveur distant/SSH/DNS/HTTPS — requalifié honnêtement, cf.
  consigne §6). `.env.staging` **réel hors dépôt** (secrets jetables, shred). Résultats
  (`cores/cloud/docs/STAGING_EXECUTION_REPORT.md`) : `compose config` valide (**no `latest`**), **migrations
  depuis l'image** (Option A, offline, 5 appliquées), **API & Web `Up (healthy)`**, `/health/live`+`/health/ready`
  +`/`+`/login` = **200**, **endpoint MinIO Option A joignable** par l'hôte (navigateur). ⚠️ **Non validé** :
  **URL signée** de bout en bout (presign `mc` → **403** ; presign **de l'API non exercé**) et **Auth/Files**
  applicatifs (**aucun utilisateur staging** — seed RBAC nécessite devDeps/egress, indisponibles). **Sécurité** :
  staging **technique interne local, NON sécurisé production** (pas d'HTTPS/DNS/pare-feu). **Décision §20** :
  **arrêt** après validation (`down -v`, volumes/secrets jetables supprimés). **Aucune** modification de
  `cores/*/src`/`packages`/`docs/adr`/`strategy`/Dockerfiles/workflows ; **aucun secret/`latest`/déploiement
  réel**. Statuts **inchangés** (Cloud Core `IMPLEMENTATION_PARTIELLE` ; ADR-013/014 partiels) ; **déploiement
  staging = `EXECUTION_LOCALE_CONTROLEE`** (ni « réelle sur serveur » ni production-ready). Mergé via **PR #9**
  (`5589198`). Prochaine action : **revue d'alignement**.
- **Revue stratégique d'alignement roadmap (2026-06-11, `ROADMAP_ALIGNMENT_REVIEW.md`)** : **aucun code modifié**.
  Constat : la séquence **Cloud Core 1→9** a livré une **vraie valeur** (CI non-régression, **images GHCR
  bootables** après le fix CC8, `api-smoke`, runbooks, staging local exécuté) **mais a dépassé l'ordre roadmap**
  (`04_ROADMAP_GLOBAL.md` : CI/CD = **V2**, registry/staging = **V3/VF**) **alors que Mobile Core RN — priorité
  #2 V1 — n'a jamais été démarré** (zéro code), ses dépendances (API + packages + tokens UI Kit RN-safe) étant
  **satisfaites**. Le pas suivant Cloud (**CC10 serveur réel**) dépend d'une **ressource externe** (serveur +
  HTTPS/DNS/pare-feu) et relève de l'**ops**, pas du socle → **point d'arrêt raisonnable**. **DÉCISION (une
  seule)** : **Cloud Core en PAUSE contrôlée** ; **retour aux priorités V1** → **prochaine action unique : Mobile
  Core React Native 1 — starter foundation**. Statuts **inchangés** (aucun gonflé). Commit `docs(project): review
  roadmap alignment after cloud core`.
- **Cloud Core 10 — staging HTTPS reel (2026-07-11)** : reprise explicite de Cloud une fois le serveur staging
  disponible. `docker-compose.cc10.yml` livre un deploiement staging avec reverse proxy compatible Traefik,
  Let's Encrypt, images GHCR immuables `sha-5bf4c0f`, PostgreSQL non expose, MinIO API routee via
  `s3-staging.enistere.com`, Web via `staging.enistere.com`, secrets hors depot. Validation bout-en-bout :
  CSRF/login BFF, `/me`, `/authorization`, upload PNG MinIO, URL signee HTTPS navigateur et telechargement 200.
  **Aucun secret dans le rapport**. Statut Cloud alors maintenu `IMPLEMENTATION_PARTIELLE` : staging reel prouve,
  mais pas encore revue V1 ni decision Redis/Compose.
- **Cloud Core 11 — durcissement operationnel staging (2026-07-11)** : scripts versionnes
  `backup-postgres.sh`, `backup-minio.sh`, `rotate-smoke-account.sh`, runbook operationnel et rapport CC11.
  Preuves executees : health HTTPS + TLS OK, backup PostgreSQL + restore valide, backup MinIO + restore test,
  rollback `sha-484f98d` healthy puis roll-forward `sha-5bf4c0f`, rotation smoke argon2id sans valeur conservee.
  Decision de gouvernance : les tests Cloud reels restants deviennent des **gates finaux**, pas des checks a
  relancer a chaque mission.
- **Cloud Core V1 Readiness Review (2026-07-12)** : rapport
  `docs/project-status/CLOUD_CORE_V1_READINESS_REVIEW.md`. Decision : Cloud Core passe de
  **`IMPLEMENTATION_PARTIELLE`** a **`IMPLEMENTATION_AVANCEE`**. Justification : CI runtime/E2E/registry,
  staging HTTPS reel CC10, backups/restores/rollback CC11, runbooks et absence de secret dans Git. `VALIDE_V1`
  est differe : Redis reste un item V1 historique non livre et la structure Compose V1 generique doit etre
  tranchee. Prochaine action : **Cloud Core 12 — decision Redis/Compose V1**.
- **Cloud Core 12 — decision Redis/Compose V1 (2026-07-12)** : rapport
  `docs/project-status/CLOUD_CORE_12_REDIS_COMPOSE_DECISION.md`. Decisions : Redis est reporte post-V1/V2 en
  coherence avec API Core (`API_CORE_V1_NEXT_ROADMAP.md` P2) ; `docker-compose.cc10.yml` devient le compose
  serveur/staging V1 officiel ; `docker-compose.staging.example.yml` reste un exemple historique/manual.
  Cloud Core passe de **`IMPLEMENTATION_AVANCEE`** a **`VALIDE_V1`** sur preuves CC10/CC11. Aucun acces serveur
  reel, secret, workflow ou dependance ajoute.
- **ADR-016 (reste)** — **publication** des packages (toujours non publiés/privés) ; **intégration cores FAITE**
  (Web + **Mobile RN 4** : `@enistere/api-client-fetch` consommé) ; adaptateurs Angular/Dart futurs.

## 3. ADR au backlog, NON rédigés

`ADR-017→033` et `ADR-036→038` sont listés dans [`../../docs/adr/ADR_BACKLOG.md`](../../docs/adr/ADR_BACKLOG.md)
avec le statut « À rédiger » (queues, monitoring, crash reporting, E2E, i18n, icônes, maps, offline,
backups, déploiement avancé, charts, observabilité distribuée, feature flags,
analytics…). **Aucun fichier ADR correspondant n'existe** → `NON_APPLICABLE_ACTUELLEMENT` jusqu'à
rédaction.

> **Note ADR-035 (2026-07-15)** : ADR-035 est maintenant validé. `web-angular` reste
> `DOSSIER_SEULEMENT` tant que sa spécification et son starter ne sont pas livrés.

> **Note ADR-034 (2026-07-14)** : ADR-034 est maintenant validé. `mobile-flutter` reste
> `DOSSIER_SEULEMENT` tant que sa spécification et son starter ne sont pas livrés.

## 4. Règle de lecture

Un ADR **Validé** documente une **décision**, pas une **implémentation**. Vérifier toujours la colonne
« Statut implémentation » et la « Preuve » avant de considérer une capacité comme disponible. Toute
divergence avec le repository doit être signalée et corrigée dans ce registre, jamais supposée.
