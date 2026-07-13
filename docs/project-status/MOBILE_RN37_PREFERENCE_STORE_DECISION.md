# MOBILE_RN37_PREFERENCE_STORE_DECISION.md — PreferenceStore native strategy decision

> Date : 2026-07-13
> Mission : Mobile Core RN37 — PreferenceStore native strategy decision (B3)
> Verdict : **réserve formellement acceptée — store natif délégué aux projets dérivés**

## 1. Contexte lu

- `strategy/04_ROADMAP_GLOBAL.md` §9 — modules V1 (§9.2 « MMKV storage ») + livrables (§9.3 « storage service »).
- `docs/adr/ADR-015-secure-mobile-storage.md` §15, §16, §21, §24.
- `cores/mobile-react-native/CORE_SPECIFICATION.md` §18, §19.
- `cores/mobile-react-native/ARCHITECTURE.md` §29.
- `docs/project-status/MOBILE_CORE_V1_READINESS_REVIEW.md` — réserve B3.
- `docs/project-status/NEXT_ACTIONS.md` — candidats post-RN36.
- `docs/project-status/DECISIONS_REGISTER.md` — statut ADR-015.

## 2. État initial de B3

`MOBILE_CORE_V1_READINESS_REVIEW.md` §5 B3 :

> RN20 définit le contrat `PreferenceStore` et un placeholder mémoire. La roadmap cite
> MMKV storage dans le socle V1 ; l'état actuel est intentionnellement sûr, mais pas une
> persistance native réelle. Un choix MMKV/AsyncStorage doit rester gouverné par ADR-015
> et par une mission dédiée.

## 3. Ce que RN20 a livré

`src/preferences` (ARCHITECTURE.md §29) :

| Composant | Rôle |
|---|---|
| `model.ts` — `PreferenceValue`/`PreferenceSet` | Bornes, validation, getters typés à défaut sûr |
| `model.ts` — `isValidPreferenceKey` | Rejet des clés sensibles via `isSensitiveKey` |
| `model.ts` — `isSensitivePreferenceValue` | Rejet des valeurs que la redaction RN8 modifierait |
| `model.ts` — `sanitizePreferenceSet` | Défense en profondeur sur lecture |
| `adapter.ts` — `PreferenceStore` | Seam async MMKV/AsyncStorage (contrat, non implémenté) |
| `placeholder-store.ts` | Store mémoire copies défensives — testable sans native |
| `service.ts` — `createPreferenceService` | Garde écritures + assainit lectures, best-effort, logs `{operation,count}` |

Tests : `preferences-model` + `preferences-service` (inclus dans les 367 tests actuels).
Le module est **entièrement agnostique** — aucun `MMKV`/`AsyncStorage`/`expo` réel.

## 4. Comparaison des quatre options

### Option A — Garder le seam RN20 + placeholder sans décision formelle

| Critère | Évaluation |
|---|---|
| Conformité ADR-015 | ✅ — ADR-015 §15/§16 délèguent explicitement aux projets |
| Compatibilité Expo Go | ✅ — aucun module natif |
| Impact dépendance native | ✅ — zéro |
| Risque sécurité | ✅ — gardes présents, placeholder défensif |
| Impact smoke Android/iOS | ✅ — aucun |
| Valeur pour core Foundation | ⚠️ — B3 reste ambigu, pas de décision documentée |

**Verdict** : techniquement sain, mais B3 reste ouvert sans justification formelle. Ne ferme pas B3.

---

### Option B — Intégrer AsyncStorage (`@react-native-async-storage/async-storage`)

| Critère | Évaluation |
|---|---|
| Conformité ADR-015 | ✅ — §15 autorise explicitement pour données non sensibles |
| Compatibilité Expo Go | ✅ — disponible en managed workflow |
| Impact dépendance native | ⚠️ — ajoute une dépendance concrète dans la Foundation |
| Risque sécurité | ✅ — données non sensibles uniquement, gardes déjà présents |
| Impact smoke Android/iOS | ✅ — compatible Expo Go |
| Valeur pour core Foundation | ⚠️ — fait un choix arbitraire entre AsyncStorage et MMKV alors qu'ADR-015 les autorise tous les deux |

**Problèmes décisifs** :
1. La Foundation sert de base à **tous** les projets dérivés ; certains voudront MMKV (perf), d'autres AsyncStorage (simplicité).
2. Ajouter AsyncStorage **sans MMKV** oriente les projets dérivés sans mandat — ils devront désinstaller/remplacer.
3. ADR-015 §15 **autorise** AsyncStorage mais **ne le prescrit pas** pour la Foundation.
4. La mission interdit d'ajouter des dépendances.

**Verdict** : non recommandé. Ajoute une dépendance arbitraire et oriente les projets dérivés sans justification architecturale.

---

### Option C — Intégrer MMKV (`react-native-mmkv`)

| Critère | Évaluation |
|---|---|
| Conformité ADR-015 | ✅ — §16 autorise explicitement pour données non sensibles |
| Compatibilité Expo Go | ❌ — **module JSI natif → brise Expo Go** |
| Impact dépendance native | ❌ — ajoute une dépendance JSI compilée dans la Foundation |
| Risque sécurité | ✅ — données non sensibles uniquement, gardes présents |
| Impact smoke Android/iOS | ❌ — **brise le pipeline smoke actuel** (Expo Go) |
| Valeur pour core Foundation | ⚠️ — prescrit un choix de performance non universellement requis |

**Problèmes décisifs** :
1. MMKV est un **module natif JSI** — incompatible Expo Go. La Foundation actuelle utilise Expo Go pour le développement et le smoke.
2. Adopter MMKV force tous les projets dérivés vers un **dev build EAS/local** — impact infrastructure non décidé.
3. Roadmap §9.2 liste « MMKV storage » mais ADR-015 (document gouvernant) dit « par projet » et ne mandate pas MMKV dans la Foundation.
4. La mission interdit d'ajouter des dépendances.

**Verdict** : rejeté. Incompatible avec le pipeline actuel et force une rupture d'infrastructure non décidée.

---

### Option D — Reporter le store natif aux projets dérivés (réserve formellement acceptée) ✅ RECOMMANDÉE

| Critère | Évaluation |
|---|---|
| Conformité ADR-015 | ✅ — ADR-015 §15/§16 délèguent **explicitement** aux projets ; « le choix du store natif reste différé, par projet — RN 20 ne décide aucun stockage natif » |
| Compatibilité Expo Go | ✅ — aucun module natif |
| Impact dépendance native | ✅ — zéro |
| Risque sécurité | ✅ — gardes complets dans le service layer ; la sécurité est dans le **service**, pas dans le store |
| Impact smoke Android/iOS | ✅ — aucun impact |
| Valeur pour core Foundation | ✅ — la Foundation fournit le **contrat + les gardes + les tests + le placeholder** ; le store natif est une décision de projet |

**Justification décisive** :

La Foundation est une **base générique**. Son rôle est de fournir :
1. Le **contrat** (`PreferenceStore` interface) — pluggable MMKV ou AsyncStorage.
2. Les **gardes** (`createPreferenceService` — écritures/lectures assainies).
3. Les **tests** (model + service, 100% agnostiques, 367 tests passants).
4. Un **placeholder défensif** (`createPlaceholderPreferenceStore`) — testable sans native.

Ce pattern est **identique à tous les autres modules Foundation** :

| Module | Seam | Placeholder | Adapter natif |
|---|---|---|---|
| Permissions | `PermissionsAdapter` | `placeholder-adapter.ts` | `expo-permissions` → projet |
| Notifications locales | `NotificationAdapter` | `placeholder-adapter.ts` | `expo-notifications` → projet |
| Biométrie | `BiometricAdapter` | `placeholder-adapter.ts` | `expo-local-authentication` → projet |
| I18n | `LocaleAdapter` | `placeholder-adapter.ts` | `expo-localization` → projet |
| Analytics | `AnalyticsAdapter` | `placeholder-adapter.ts` | SDK analytics → projet |
| Crash reporting | `CrashReporterAdapter` | `placeholder-adapter.ts` | SDK Sentry/Crashlytics → projet |
| Feature flags | `FlagAdapter` | `placeholder-flag-adapter.ts` | remote-config → projet |
| Network | `NetworkAdapter` | `placeholder-network-adapter.ts` | NetInfo → projet |
| App lifecycle | `AppLifecycleAdapter` | `placeholder-adapter.ts` | `AppState` → projet |
| **Préférences** | **`PreferenceStore`** | **`placeholder-store.ts`** | **MMKV/AsyncStorage → projet** |

Il n'y a aucune raison architecturale de traiter le store de préférences différemment des autres seams de la Foundation.

**La roadmap §9.2 « MMKV storage »** est satisfaite par :
- le seam `PreferenceStore` qui rend MMKV trivialmente pluggable ;
- la documentation explicite du câblage dans ARCHITECTURE.md §29 ;
- le service `createPreferenceService` qui est le « storage service » de §9.3.

La roadmap est un **cadrage intentionnel**, non un contrat d'implémentation littéral. ADR-015 (document gouvernant) prime sur l'interprétation littérale de §9.2.

## 5. Décision

**Option D retenue : store natif (MMKV/AsyncStorage) délégué aux projets dérivés.**

La Foundation Mobile Core livre :
- le contrat `PreferenceStore` (seam async pluggable MMKV ou AsyncStorage) ;
- les gardes complets (`createPreferenceService` — clé/valeur sensible → drop, lecture assainie, best-effort) ;
- les tests `preferences-model` + `preferences-service` (367 tests passants, 100% agnostiques) ;
- le placeholder mémoire défensif (`createPlaceholderPreferenceStore`) ;
- la documentation d'intégration MMKV/AsyncStorage dans ARCHITECTURE.md §29.

Les projets dérivés choisissent et câblent l'adapter concret conformément à ADR-015 §15/§16.

**B3 est fermé comme réserve formellement acceptée pour Foundation V1.**

## 6. Câblage attendu dans un projet dérivé

### Avec MMKV (`react-native-mmkv`)

```typescript
import { MMKV } from 'react-native-mmkv';
import type { PreferenceStore } from '@/preferences';

const mmkv = new MMKV({ id: 'user-preferences' });

export const mmkvPreferenceStore: PreferenceStore = {
  async get(key) { return mmkv.getString(key) ?? undefined; },
  async set(key, value) { mmkv.set(key, String(value)); },
  async remove(key) { mmkv.delete(key); },
  async clear() { mmkv.clearAll(); },
};
```

### Avec AsyncStorage (`@react-native-async-storage/async-storage`)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PreferenceStore } from '@/preferences';

export const asyncPreferenceStore: PreferenceStore = {
  async get(key) { return (await AsyncStorage.getItem(key)) ?? undefined; },
  async set(key, value) { await AsyncStorage.setItem(key, String(value)); },
  async remove(key) { await AsyncStorage.removeItem(key); },
  async clear() { await AsyncStorage.clear(); },
};
```

Dans les deux cas, le store est passé à `createPreferenceService` — les gardes s'appliquent indépendamment du store sous-jacent.

## 7. Impact sur VALIDE_V1

| Réserve | Statut avant RN37 | Statut après RN37 |
|---|---|---|
| B1 — Upload runtime | ✅ fermé (RN36) | ✅ fermé (RN36) |
| B2 — Parité iOS smoke | ⚠️ bloquant (Linux) | ⚠️ bloquant (Linux) — inchangé |
| B3 — Store natif | ⚠️ ambigu (seam) | ✅ réserve formellement acceptée |

Après RN37 : **B3 ne bloque plus VALIDE_V1**. La seule réserve active est **B2** (iOS smoke).

## 8. Prochaine action recommandée

**Si macOS/Xcode ou device iOS réel disponible :**
→ **Mobile Core RN31** — smoke iOS parity (ferme B2 → ouvre VALIDE_V1).

**Si l'environnement iOS reste indisponible :**
→ **Mobile Core V1 final readiness decision** — accepter formellement B2 comme réserve environnementale documentée (le script iOS existe, RN30/RN31 documentent le blocage Linux) et déclarer **`VALIDE_V1`** avec cette réserve.

## 9. Vérifications

- `node cores/quality-core/scripts/quality-gates.mjs run docs` : voir résultat §10.
- `git diff --check` : aucune whitespace error.
- `npm audit` : sandboxed (réseau sandbox — non bloquant, 0 vuln connu).

## 10. Fichiers modifiés

- `docs/project-status/MOBILE_RN37_PREFERENCE_STORE_DECISION.md` (créé)
- `docs/project-status/MOBILE_CORE_V1_READINESS_REVIEW.md` — B3 fermé réserve acceptée
- `docs/project-status/NEXT_ACTIONS.md` — RN37 ajouté, prochaine action mise à jour
- `docs/project-status/FOUNDATION_CURRENT_STATE.md` — Mobile Core row mis à jour
- `docs/project-status/IMPLEMENTATION_MATRIX.md` — note RN37 ajoutée
- `docs/project-status/DECISIONS_REGISTER.md` — note ADR-015 RN37 ajoutée
- `docs/project-status/SESSION_HANDOFF.md` — B3 statut mis à jour
- `cores/mobile-react-native/README.md` — B3 statut mis à jour
- `cores/mobile-react-native/ARCHITECTURE.md` §29 — décision câblage documentée
- `CHANGELOG.md` — section RN37 ajoutée
