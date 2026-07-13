# MOBILE_CORE_V1_READINESS_REVIEW.md — Mobile Core React Native V1 Readiness Review

> Date : 2026-07-13  
> Décision initiale : **`STARTER_UI_KIT_ALIGNED` → `IMPLEMENTATION_AVANCEE`**
> Décision finale : **`IMPLEMENTATION_AVANCEE` → `VALIDE_V1`** via `MOBILE_CORE_V1_FINAL_READINESS_DECISION.md`.

## 1. Contexte lu

- `strategy/04_ROADMAP_GLOBAL.md` §9 — Mobile Core React Native V1.
- `cores/mobile-react-native/CORE_SPECIFICATION.md` §5, §9, §12, §13.
- `cores/mobile-react-native/ARCHITECTURE.md` §35→§40.
- `docs/project-status/FOUNDATION_CURRENT_STATE.md`.
- `docs/project-status/IMPLEMENTATION_MATRIX.md`.
- `docs/project-status/NEXT_ACTIONS.md`.
- `docs/project-status/SESSION_HANDOFF.md`.

## 2. Synthèse

Le Mobile Core React Native a dépassé le simple starter : Expo SDK 55, Expo Router,
auth/session durcie, client API officiel, pont 401, TanStack Query, Zustand, RHF/Zod,
upload multipart, logger/redaction, permissions, notifications locales, i18n,
deep-linking, analytics/crash/consentement, app environment, clipboard, retry,
telemetry coordinator, Settings shell, smoke Android et alignement UI Kit RN35 sont
présents et documentés.

La promotion en **`IMPLEMENTATION_AVANCEE`** était justifiée. Depuis RN36 et RN37,
les gaps B1 et B3 sont fermés : l'upload runtime mobile est prouvé sur Android smoke,
et le store natif de préférences est formellement délégué aux projets dérivés selon
ADR-015. La décision finale du 2026-07-13 accepte B2 comme réserve environnementale
documentée et promeut le core à **`VALIDE_V1`** :

- smoke iOS non exécuté, bloqué par absence macOS/Xcode/device iOS.

Cette réserve ne remet pas en cause l'architecture et ne revendique aucun succès iOS
artificiel.

## 3. Critères roadmap §9.4

| Critère | Verdict | Preuve |
|---|---|---|
| L'app démarre avec Expo | ✅ satisfait | `expo-doctor 19/19`, `expo export -p ios`, starter lancé en RN27/RN28/RN29 |
| Navigation fonctionnelle | ✅ satisfait | Expo Router public/protégé, Home, Settings, guards auth, Android smoke |
| Auth flow prêt | ✅ satisfait | AuthEngine, SecureStore, sign-in RN32, refresh/logout, 401 bridge RN4B |
| Token correctement stocké | ✅ satisfait | access token mémoire, refresh token SecureStore, purge logout/cache |
| API calls prêts | ✅ satisfait | `@enistere/api-client-fetch` intégré, `authedRequest`, Query layer |
| Upload via fetch fonctionne | ✅ satisfait | `useUploadMutation` primitives + écran `app/(app)/upload.tsx` RN36 ; smoke Android étendu (`POST /files` mock, fixture `enistere-smoke.txt`, `Upload complete` vérifié) |
| UI base components existent | ✅ satisfait | `Screen`, `Text`, `Button`, Settings shell, tokens UI Kit RN35 |
| Loading/error/empty states existent | ✅ satisfait | `LoadingState`, `ErrorState`, `EmptyState`, aliases `*View` RN35 |

Résultat : **8/8 satisfaits** (B1 fermé par RN36).

## 4. Modules obligatoires §9

| Module | Verdict |
|---|---|
| App structure Expo / Expo Router / protected routes | ✅ |
| Auth flow / token management / Secure storage | ✅ |
| API client officiel | ✅ |
| Upload client fetch + FormData | ✅ primitives prêtes + runtime prouvé Android (RN36) |
| Query client / server state | ✅ |
| State management local | ✅ |
| Theme system / UI components minimal | ✅ |
| Form handling / validation | ✅ |
| Error handling / logger minimal | ✅ |
| Loading / empty states | ✅ |
| Notification setup minimal | ✅ primitives locales + permission gate, sans push réel |
| Environment config / app constants | ✅ |
| Testing setup | ✅ node --test + doctor + export + smoke Android |
| Persistance non sensible type MMKV/AsyncStorage | ⚠️ seam + placeholder, pas de store natif réel |

## 5. Réserves initialement bloquantes pour `VALIDE_V1`

### B1 — Upload runtime mobile ✅ fermé (RN36)

RN36 ajoute `app/(app)/upload.tsx` (écran protégé générique, formulaire RHF + Zod,
`useUploadMutation` via le client officiel, états `LoadingState`/`MessageState`/`ErrorState`),
`ROUTES.upload`, le lien depuis Home et étend le smoke Android (`POST /files` mock,
fixture `enistere-smoke.txt` via `adb shell`, vérification `Upload complete` et
`uploadCount >= 1`). Aucune URL signée, token ni payload serveur en log, cache ou store.

### B2 — Parité iOS non exécutée ✅ réserve environnementale acceptée

RN30/RN31 documentent proprement le blocage : hôte Linux, `xcrun` absent. Aucun succès
iOS artificiel ne doit être revendiqué. Ce blocage est environnemental, mais une V1
mobile déclarée doit idéalement disposer d'une preuve iOS macOS/device ou d'une décision
formelle qui l'accepte comme réserve non bloquante.

La décision finale `MOBILE_CORE_V1_FINAL_READINESS_DECISION.md` accepte B2 comme réserve
environnementale non bloquante. RN31 reste à exécuter dès qu'un environnement Apple réel
est disponible.

### B3 — Store natif non sensible ✅ réserve formellement acceptée (RN37)

RN37 (`MOBILE_RN37_PREFERENCE_STORE_DECISION.md`, 2026-07-13) tranche le gap B3 :
le store de préférences natif (MMKV/AsyncStorage) est **formellement délégué aux projets dérivés**,
conformément à ADR-015 §15/§16 et au pattern seam+placeholder de tous les autres modules Foundation
(permissions, notifications, biométrie, analytics, crash, i18n, network, feature flags, etc.).

**Ce que RN20 livre pour Foundation V1** :
- contrat `PreferenceStore` (seam async pluggable MMKV ou AsyncStorage) ;
- gardes complets `createPreferenceService` (clé/valeur sensible → drop, lecture assainie, best-effort) ;
- tests `preferences-model` + `preferences-service` (100% agnostiques, inclus dans les 367 tests) ;
- placeholder mémoire défensif (`createPlaceholderPreferenceStore`) ;
- documentation câblage MMKV/AsyncStorage dans ARCHITECTURE.md §29.

**Pourquoi MMKV n'est pas ajouté à la Foundation** : module JSI natif → brise Expo Go + pipeline smoke.
**Pourquoi AsyncStorage n'est pas ajouté** : ferait un choix arbitraire entre deux options valides selon ADR-015.
**Référence** : `docs/project-status/MOBILE_RN37_PREFERENCE_STORE_DECISION.md`.

B3 ne bloque plus `VALIDE_V1`.

## 6. Réserves non bloquantes

- Plusieurs modules sont des seams + placeholders par design : permissions, notifications,
  lifecycle, network, analytics/crash, environment, clipboard.
- Aucun SDK analytics/crash/push réel n'est branché, cohérent avec ADR-038/ADR-019 non
  décidés.
- Pas d'EAS build, pas de store app, pas de test device CI mobile complet.
- Pas de logique métier ni d'endpoint métier, ce qui est conforme au rôle du core.

## 7. Décision

Le Mobile Core React Native est promu à **`VALIDE_V1`** par
`MOBILE_CORE_V1_FINAL_READINESS_DECISION.md`.

Le statut garde une réserve explicite : aucun smoke iOS réel n'a été exécuté. B2 est
acceptée comme réserve environnementale non bloquante, sans preuve iOS artificielle.

## 8. Prochaine mission recommandée

**Post-V1 Mobile Core**.

RN31 reste souhaitable dès qu'un environnement macOS/Xcode ou device iOS réel est disponible.
Sans environnement Apple, continuer vers les incréments V2/VF ou les intégrations de projets dérivés.
