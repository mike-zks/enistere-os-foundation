# Mobile RN32 — Formulaire Sign-in Générique RHF/Zod

Date : 2026-07-08  
Core : `cores/mobile-react-native`  
Statut : **STARTER_SIGN_IN_FORM_READY**

## Objectif

RN32 remplace le bouton sign-in avec credentials hardcodés par un formulaire
générique email/password utilisant React Hook Form + Zod via les primitives
existantes RN3, sans nouvelle dépendance, sans backend réel, sans logique
métier.

## Changements

### `app/(public)/sign-in.tsx`

Ancien écran : un bouton « Sign in » unique déclenchait `signIn` avec les
credentials hardcodés `demo@example.com` / `demo`.

Nouvel écran :

- Formulaire RHF (`useForm`, `handleSubmit`, `isSubmitting`) avec
  `createZodResolver(signInSchema)`.
- Schéma Zod défini localement : `emailField()` + `requiredText()` (primitives
  RN3 de `src/forms/validation.ts`), UX uniquement — le backend reste
  autoritatif (ADR-003 §18).
- Champ **Email** (`TextInputField`, `keyboardType="email-address"`,
  `returnKeyType="next"`) : valide le format email côté client.
- Champ **Password** (`TextInputField`, `secureTextEntry`,
  `returnKeyType="send"`, `onSubmitEditing` → `handleSubmit`) : requis
  non-vide.
- Erreurs de champ accessibles via `FormField` / `FormError` (live region
  polite, ADR-010 §16, spec §45).
- Erreur auth affichée comme message générique : « Sign-in failed. Please
  check your credentials and try again. » (aucune fuite sensible).
- État loading sur le bouton via `isSubmitting`.
- Credentials hardcodés **supprimés**.

### `scripts/smoke-android.js`

- Ajout de `SMOKE_EMAIL` et `SMOKE_PASSWORD` (env `RN_SMOKE_EMAIL` /
  `RN_SMOKE_PASSWORD`, défauts `smoke@example.com` / `smoke`) — credentials
  de smoke non sensibles, utilisés uniquement avec le mock auth local.
- Ajout de `findInputByLabel(xml, label)` : recherche par `content-desc`
  uniquement (non `text=`), afin de cibler les `EditText` RN et non les
  `TextView` de `FormLabel`.
- Ajout de `waitForInputByLabel(label, timeoutMs)` et
  `tapInputAndType(label, text)`.
- Flux sign-in mis à jour : remplissage du champ Email, puis Password, puis
  `adb shell input keyevent 66` (ENTER → `onSubmitEditing` → soumission du
  formulaire).

### `scripts/smoke-ios.js`

- Procédure mise à jour pour mentionner le formulaire email/password et les
  credentials de smoke (RN32).

## Comportement de validation

| Cas | Résultat |
|---|---|
| Email vide + soumission | Erreur champ : « Enter a valid email address. » |
| Email malformé + soumission | Erreur champ : « Enter a valid email address. » |
| Password vide + soumission | Erreur champ : « This field is required. » |
| Formulaire valide → mock auth → succès | Navigation Home protégé |
| Formulaire valide → auth failure | Message générique sans fuite |
| Appui Enter sur le champ Password | Déclenche `onSubmitEditing` → submit |

## Impact smoke Android

Le script smoke RN29 est adapté pour RN32 :

- Détection de l'écran sign-in : inchangée (`findNode(xml, 'Sign in')` —
  le bouton « Sign in » est toujours présent).
- Remplissage formulaire : `tapInputAndType('Email', SMOKE_EMAIL)` puis
  `tapInputAndType('Password', SMOKE_PASSWORD)`.
- Soumission : `adb shell input keyevent 66` (ENTER) déclenche
  `onSubmitEditing` sur le champ Password.
- Mock auth local : inchangé (POST `/auth/login` + POST `/auth/refresh`).
- Sur cet hôte Linux sans device Android : `smoke:android` → `blocked`
  (aucun device via adb). Non régressé.

## Impact smoke iOS

RN31 reste bloquée par précondition externe (Linux, pas de macOS/xcrun). La
procédure `smoke-ios.js` est mise à jour pour décrire le formulaire RN32.

## Hors périmètre confirmé

- Aucune dépendance nouvelle.
- Aucun endpoint métier.
- Aucun register / forgot password / OAuth / onboarding.
- Aucun changement AuthEngine, `withAuthRetry`, `authedRequest`,
  QueryClient, mutations.
- Aucun stockage de password.
- Aucun log de password/email brut (le logger ne reçoit que des méta-données
  de champ).
- Aucune copie de DTO API.

## Vérifications RN32

Depuis `cores/mobile-react-native` :

- `npm run typecheck` — **vert**
- `npm run lint` — **vert**
- `npm test` — **355/355 vert** (inchangé, tests des primitives RN3 couvrent
  `emailField` / `requiredText` / `validateWith`)
- `npm run doctor` — **18/19** (1 check : drift patch Expo pré-existant,
  non causé par RN32 — expo `55.0.26 < ~55.0.27`, expo-linking `55.0.15 <
  ~55.0.16`, expo-secure-store `55.0.14 < ~55.0.15`)
- `npx expo export -p ios` — **vert** (bundle iOS 3.1 MB produit)
- `npm run smoke:android` — **blocked** (Linux, aucun device Android)
- `npm run smoke:ios` — **blocked** (`linux`, pas de macOS/xcrun)

Depuis la racine :

- `npm audit` — **0 vulnérabilités**
- `git diff --check` — **vert**

## Prochaine mission unique recommandée

**Mobile Core React Native 33** — à définir par décision humaine selon la
roadmap. Candidats : durcissement UX du formulaire (feedback visuel, retour
clavier, KeyboardAvoidingView), ou avancement vers un autre livrable V1
(UI Kit 4 primitives interactives, Web Core Files 2).

RN31 (exécution iOS smoke sur macOS/device réel) reste en attente d'un
environnement macOS/Xcode externe.
