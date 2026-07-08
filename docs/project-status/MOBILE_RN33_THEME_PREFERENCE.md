# MOBILE_RN33_THEME_PREFERENCE.md — Rapport de mission

> Branche : `mobile-core-rn-33-theme-preference`
> Commit : `feat(mobile): wire theme preference`
> Statut cible : **`STARTER_THEME_PREFERENCE_READY`**

## Objectif

Câbler la préférence de thème locale (`system` / `light` / `dark`) au `ThemeProvider`
et fournir un contrôle Settings minimal, sans persistance, sans dépendance, sans UI Kit réel.

## Changements

### `src/theme/ThemePreferenceProvider.tsx` (nouveau)

Binding React entre `useUiStore.themePreference` et `ThemeProvider` :

- `'system'` → `scheme={undefined}` → `ThemeProvider` suit `useColorScheme()` (comportement OS)
- `'light'` → `scheme="light"` (forçage)
- `'dark'` → `scheme="dark"` (forçage)

Seul point de couplage entre `src/store` et `src/theme`.

### `src/theme/index.ts`

Exporte `ThemePreferenceProvider`.

### `app/_layout.tsx`

Remplace `<ThemeProvider>` par `<ThemePreferenceProvider>`. Le layout racine ne change
pas structurellement — le fournisseur de thème reste en tête de l'arbre.

### `app/(app)/settings.tsx`

Section "Preferences / UI" :
- Ajout de `setThemePreference` depuis `useUiStore`
- Nouveau composant local `ThemeSelector` : 3 boutons System / Light / Dark en row
- Bouton actif en `variant="primary"`, inactifs en `variant="secondary"`
- `reset()` remet `themePreference` à `'system'` (logique inchangée dans `ui-state.ts`)

## Comportement thème

| Préférence | Comportement |
|---|---|
| `system` (défaut) | Suit l'OS via `useColorScheme()` — change automatiquement avec le mode sombre système |
| `light` | Forçage clair — ignore l'OS |
| `dark` | Forçage sombre — ignore l'OS |

## Confirmation non-persistance / non-sensible

- **In-memory uniquement** : `themePreference` vit dans `useUiStore` (Zustand), sans
  MMKV/AsyncStorage/SecureStore. La préférence disparaît au redémarrage de l'app.
- **`reset()` déterministe** : `useUiStore.reset()` appelle `resetUiState()` qui retourne
  `{ themePreference: 'system', flags: {} }` — confirmé par `ui-state.test.ts` existant.
- **Aucune donnée sensible** : le store `UiState` n'autorise structurellement qu'un enum
  (`ThemePreference`) et des booléens — aucun token/profil/payload serveur ne peut y être
  stocké (ADR-015).
- **Contraintes respectées** : aucune dépendance nouvelle, aucun endpoint métier, aucun
  changement AuthEngine/`withAuthRetry`/`authedRequest`/QueryClient/mutations, aucun SDK/
  adaptateur natif réel, aucun stockage sensible, aucun log de données sensibles.

## Tests exécutés

| Check | Résultat | Note |
|---|---|---|
| `npm run typecheck` | ✅ 0 erreur | `tsc --noEmit` strict |
| `npm run lint` | ✅ 0 finding | `expo lint` / eslint-config-expo |
| `npm test` | ✅ 355/355 | `node --test` — aucun nouveau test pur nécessaire (binding React UI simple) |
| `npm run doctor` | ⚠️ 18/19 | 1 check échoue — drift patch Expo SDK pré-existant depuis RN30, non causé par RN33 |
| `npx expo export -p ios` | ✅ bundle iOS 3.1 MB | `ThemePreferenceProvider` inclus dans le bundle |
| `npm run smoke:android` | ⚠️ blocked | Aucun émulateur/device Android connecté à ce moment |
| `npm run smoke:ios` | ⚠️ blocked | Linux, `xcrun` absent — comportement attendu et inchangé |
| `npm audit` (racine) | ✅ 0 vulnérabilités | |
| `git diff --check` | ✅ propre | |

## Limites connues

- **Pas de persistance** : la préférence thème est perdue au redémarrage. C'est intentionnel
  (ADR-015 §16, mission) ; si une persistance est souhaitée, elle devra passer par
  `PreferenceService` (RN 20) avec MMKV/AsyncStorage réel — décision ADR séparée.
- **Doctor 18/19** : drift patch Expo SDK (`expo`/`expo-linking`/`expo-secure-store`
  légèrement en retard) — condition pré-existante, non liée à RN33.
- **Smoke Android bloqué** : aucun émulateur connecté lors de la vérification locale.
  Le script `smoke-android.js` n'a pas été adapté pour RN33 car le sélecteur de thème
  est une action Settings secondaire, non requise dans le smoke actuel.

## Prochaine mission unique recommandée

**Mobile Core React Native 31 — exécution iOS smoke sur macOS/device réel** : rejouer
le parcours RN28/RN29 sur iOS Simulator ou device physique dès qu'un environnement
macOS/Xcode est disponible. Candidat alternatif : **RN 34** (persistance `themePreference`
via `PreferenceService` RN 20 si la non-persistance devient un gap V1), ou **UI Kit 4**
(primitives interactives Dialog/Select/Toast).
