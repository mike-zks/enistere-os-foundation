# MOBILE_CORE_V1_READINESS_REVIEW.md — Mobile Core React Native V1 Readiness Review

> Date : 2026-07-13  
> Décision : **`STARTER_UI_KIT_ALIGNED` → `IMPLEMENTATION_AVANCEE`**  
> Verdict : **socle mobile V1 avancé, pas encore `VALIDE_V1`**.

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

La promotion en **`IMPLEMENTATION_AVANCEE`** est justifiée. La promotion en
**`VALIDE_V1`** reste prématurée, car trois preuves ou livrables V1 restent ouverts :

- upload runtime mobile non prouvé sur device/simulateur avec le client réel ;
- smoke iOS non exécuté, bloqué par absence macOS/Xcode/device iOS ;
- persistance non sensible réelle volontairement non branchée (`PreferenceStore` est
  un seam MMKV/AsyncStorage + placeholder).

Ces réserves ne remettent pas en cause l'architecture. Elles empêchent seulement de
déclarer la V1 mobile pleinement validée.

## 3. Critères roadmap §9.4

| Critère | Verdict | Preuve |
|---|---|---|
| L'app démarre avec Expo | ✅ satisfait | `expo-doctor 19/19`, `expo export -p ios`, starter lancé en RN27/RN28/RN29 |
| Navigation fonctionnelle | ✅ satisfait | Expo Router public/protégé, Home, Settings, guards auth, Android smoke |
| Auth flow prêt | ✅ satisfait | AuthEngine, SecureStore, sign-in RN32, refresh/logout, 401 bridge RN4B |
| Token correctement stocké | ✅ satisfait | access token mémoire, refresh token SecureStore, purge logout/cache |
| API calls prêts | ✅ satisfait | `@enistere/api-client-fetch` intégré, `authedRequest`, Query layer |
| Upload via fetch fonctionne | ⚠️ partiel | primitives `useUploadMutation` et FormData prêtes ; pas de runtime mobile upload prouvé |
| UI base components existent | ✅ satisfait | `Screen`, `Text`, `Button`, Settings shell, tokens UI Kit RN35 |
| Loading/error/empty states existent | ✅ satisfait | `LoadingState`, `ErrorState`, `EmptyState`, aliases `*View` RN35 |

Résultat : **7/8 satisfaits**, **1/8 partiel**.

## 4. Modules obligatoires §9

| Module | Verdict |
|---|---|
| App structure Expo / Expo Router / protected routes | ✅ |
| Auth flow / token management / Secure storage | ✅ |
| API client officiel | ✅ |
| Upload client fetch + FormData | ⚠️ primitives prêtes, runtime non prouvé |
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

## 5. Réserves bloquantes pour `VALIDE_V1`

### B1 — Upload runtime mobile non prouvé

RN7 fournit les primitives sûres : `MobileFile`, `useUploadMutation`,
`apiClient.files.upload`, redaction et absence de cache durable. Il manque une preuve
runtime mobile gouvernée : écran ou shell de diagnostic générique, soumission d'un
fichier sur Android, et vérification que le parcours utilise le client officiel sans
fuite de token, URL signée ou contenu.

### B2 — Parité iOS non exécutée

RN30/RN31 documentent proprement le blocage : hôte Linux, `xcrun` absent. Aucun succès
iOS artificiel ne doit être revendiqué. Ce blocage est environnemental, mais une V1
mobile déclarée doit idéalement disposer d'une preuve iOS macOS/device ou d'une décision
formelle qui l'accepte comme réserve non bloquante.

### B3 — Store natif non sensible non branché

RN20 définit le contrat `PreferenceStore` et un placeholder mémoire. La roadmap cite
MMKV storage dans le socle V1 ; l'état actuel est intentionnellement sûr, mais pas une
persistance native réelle. Un choix MMKV/AsyncStorage doit rester gouverné par ADR-015
et par une mission dédiée.

## 6. Réserves non bloquantes

- Plusieurs modules sont des seams + placeholders par design : permissions, notifications,
  lifecycle, network, analytics/crash, environment, clipboard.
- Aucun SDK analytics/crash/push réel n'est branché, cohérent avec ADR-038/ADR-019 non
  décidés.
- Pas d'EAS build, pas de store app, pas de test device CI mobile complet.
- Pas de logique métier ni d'endpoint métier, ce qui est conforme au rôle du core.

## 7. Décision

Le Mobile Core React Native passe à **`IMPLEMENTATION_AVANCEE`**.

`VALIDE_V1` reste différé jusqu'à fermeture ou acceptation formelle des réserves B1/B2/B3.
La prochaine mission doit viser le gap le plus actionnable sans prérequis externe :
**B1, upload runtime mobile générique**.

## 8. Prochaine mission recommandée

**Mobile Core RN36 — upload runtime starter proof**.

Objectif : ajouter une surface mobile protégée et générique de diagnostic upload qui
réutilise `useUploadMutation`, les primitives RHF/Zod, les états `*View` et le client
officiel, puis prouver le parcours sur Android smoke sans endpoint métier nouveau.

Frontières :

- ne pas toucher AuthEngine, `withAuthRetry`, `authedRequest` ou QueryClient ;
- ne pas ajouter de SDK picker natif sans décision explicite ;
- ne pas stocker fichier, URL signée, token ou payload serveur ;
- ne pas déclarer `VALIDE_V1` tant que la preuve iOS ou la décision de réserve iOS n'est
  pas tranchée.
