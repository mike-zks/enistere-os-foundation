# MOBILE_CORE_V1_FINAL_READINESS_DECISION.md — Mobile Core V1 final readiness decision

> Date : 2026-07-13
> Décision : **`IMPLEMENTATION_AVANCEE` → `VALIDE_V1`**
> Réserve acceptée : **B2 — smoke iOS non exécuté, bloqué par absence macOS/Xcode/device iOS**

## 1. Contexte lu

- `strategy/04_ROADMAP_GLOBAL.md` §9 — Mobile Core React Native V1.
- `cores/mobile-react-native/CORE_SPECIFICATION.md` §38, §40, §41, §54, §55.
- `docs/project-status/MOBILE_CORE_V1_READINESS_REVIEW.md`.
- `docs/project-status/MOBILE_RN30_IOS_SMOKE_PARITY.md`.
- `docs/project-status/MOBILE_RN37_PREFERENCE_STORE_DECISION.md`.
- `docs/project-status/FOUNDATION_CURRENT_STATE.md`.
- `docs/project-status/IMPLEMENTATION_MATRIX.md`.
- `docs/project-status/NEXT_ACTIONS.md`.
- `docs/project-status/SESSION_HANDOFF.md`.

## 2. Décision

Le Mobile Core React Native est promu à **`VALIDE_V1`**.

Cette décision accepte formellement B2 comme **réserve environnementale non bloquante** :
le smoke iOS réel n'a pas été exécuté parce qu'aucun environnement macOS/Xcode ou device
iOS n'est disponible. Aucun succès iOS artificiel n'est revendiqué.

## 3. Justification

Les critères V1 applicables sont couverts :

- `CORE_SPECIFICATION.md` §54 : starter Expo, Expo Router, auth flow, routes protégées,
  token management sécurisé, refresh token SecureStore, API client, TanStack Query,
  Zustand local, formulaires/validations, états loading/error/empty, absence de secret
  applicatif et documentation minimale.
- `MOBILE_CORE_V1_READINESS_REVIEW.md` : roadmap §9.4 **8/8**.
- RN36 : B1 upload runtime fermé par écran protégé + smoke Android `POST /files`.
- RN37 : B3 PreferenceStore fermé comme réserve formellement acceptée, store natif
  délégué aux projets dérivés selon ADR-015.
- RN30/RN31 : B2 est documenté comme blocage d'environnement, pas comme défaut
  d'architecture ou échec runtime.

La specification demande que les permissions natives soient testées sur iOS et Android
**si applicable** (§38), et place les stores iOS/Android dans le cadrage build/distribution
futur (§40). Elle ne fait pas d'un smoke iOS local une condition stricte de V1.

## 4. Réserve B2 acceptée

| Point | Décision |
|---|---|
| Nature | Environnementale : hôte Linux sans `xcrun`, aucun device iOS disponible |
| Preuve existante | `npm run smoke:ios` produit un rapport `blocked`, RN30 documente la procédure macOS/device |
| Ce qui n'est pas revendiqué | Aucun smoke iOS réel, aucune preuve iOS artificielle |
| Pourquoi non bloquant | Les critères V1 applicables sont satisfaits ; l'absence iOS vient de l'infrastructure disponible, pas du code |
| Suivi futur | Exécuter RN31 dès qu'un hôte macOS/Xcode ou device iOS réel est disponible |

## 5. Limites maintenues

- Pas de build EAS, pas de store app, pas de signature iOS/Android.
- Pas de SDK natif réel pour les seams : permissions, notifications, biométrie, i18n,
  network, analytics, crash, clipboard, preferences.
- Pas de push distant, pas d'offline sync réelle, pas de SDK analytics/crash réel.
- Pas de logique métier ni d'endpoint métier.
- Pas de test iOS runtime réel tant que l'environnement Apple n'est pas fourni.

Ces limites relèvent de V2/VF ou des projets dérivés. Elles ne contredisent pas le
statut **`VALIDE_V1`** du socle Foundation.

## 6. Vérifications retenues

- Mobile static : typecheck, lint, `node --test` 367/367, expo-doctor 19/19.
- Bundle : `expo export -p ios` vert.
- Android runtime : smoke Android Emulator passé (RN28/RN29/RN34B/RN36).
- iOS preflight : `smoke:ios` blocked documenté, sans succès artificiel.
- Gouvernance : PR + CI complète avant merge ; aucune modification runtime dans cette décision.

## 7. Effet de statut

| Avant | Après |
|---|---|
| `IMPLEMENTATION_AVANCEE` | **`VALIDE_V1`** |

Le Mobile Core rejoint les cores Foundation V1 validés, avec une réserve B2 explicitement
documentée et acceptée.

## 8. Prochaine action recommandée

Retour au pilotage optimal post-V1 :

- exécuter RN31 uniquement quand un environnement Apple réel existe ;
- sinon prioriser les incréments V2/VF à forte valeur : adaptateurs natifs opt-in,
  tests mobile plus complets, ou nouveau core selon roadmap.
