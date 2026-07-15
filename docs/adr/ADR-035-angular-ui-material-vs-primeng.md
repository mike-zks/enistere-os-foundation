# ADR-035 — Angular UI : Angular Material vs PrimeNG vs composants maison

## 1. Titre

Stack UI Angular officielle pour le futur Web Core Angular.

## 2. Statut

Validé.

## 3. Date

2026-07-15.

## 4. Contexte

La V3 de la roadmap ajoute les cores secondaires multi-framework, dont **Web Core Angular**
(`cores/web-angular/`). Ce core doit rester cohérent avec le socle déjà validé : UI Kit,
Web Core Next.js, Mobile Core React Native, Mobile Core Flutter, API Cores et Cloud Core.

ADR-008 définit les design tokens Enistere comme source de vérité UI/UX, agnostique et
adaptable par plateforme (web, React Native, Flutter). ADR-009 retient, côté Web Next.js,
l'approche Tailwind CSS + shadcn/ui + Radix UI — mais ces librairies sont liées à l'écosystème
React et **ne peuvent pas être transférées côté Angular**.

ADR-034 a établi, pour Mobile Core Flutter, l'approche **Option D : Material 3 contrôlé par
tokens Enistere + composants maison ciblés**. Une logique symétrique s'applique à Angular :
utiliser un moteur UI établi comme couche comportementale, le piloter par les tokens Enistere,
et y superposer des composants maison ciblés pour l'identité Enistere.

ADR-016 §F précise que l'adaptateur client HTTP Angular (Orval Angular ou OpenAPI Generator
`typescript-angular`) sera décidé **par preuve** dans le Web Core Angular — cette ADR-035 ne
tranche pas cette question mais confirme la cohérence du contexte.

Le core `web-angular` est actuellement `DOSSIER_SEULEMENT` et ne peut progresser sans
cette décision UI préalable.

## 5. Problème

Sans décision formelle, le futur Web Core Angular risque de créer :

- une dépendance UI dupliquée avec le Web Core Next.js (shadcn/Radix, réservés React) ;
- une identité Material non contrôlée par les tokens Enistere, divergeant du UI Kit ;
- des composants maison trop coûteux à maintenir sans infrastructure a11y de base ;
- une accessibilité variable ou insuffisante (ARIA, gestion du focus, annonces lecteurs d'écran) ;
- des formulaires incohérents avec le standard `Reactive Forms` prescrit par `08_STANDARDS.md` ;
- un couplage fort à un vendeur secondaire (PrimeNG/PrimeTek) sans gain net sur le CDK Angular ;
- une divergence avec les tokens ADR-008 partagés entre plateformes.

Il faut donc choisir une base qui :

- intègre les tokens Enistere nativement via CSS custom properties ;
- fournit les primitives d'accessibilité les plus robustes disponibles pour Angular ;
- s'aligne sur les standards Angular officiels (standalone components, Reactive Forms, RxJS) ;
- ne duplique pas l'UI Kit Web React (shadcn/Radix) côté Angular ;
- reste maintenable et testable dans le cadre de la Foundation.

## 6. Options étudiées

### Option A — Angular Material (seul, identité Material par défaut)

Utiliser Angular Material (CDK + composants Material 3) avec la personnalisation légère par
défaut, sans remplacer systématiquement l'identité visuelle Material par les tokens Enistere.

Avantages :

- bibliothèque officielle Google Angular, cycle de vie aligné sur Angular ;
- CDK (Component Dev Kit) : primitives comportementales et a11y (FocusTrap, LiveAnnouncer,
  Overlay, VirtualScroll, DragDrop) — meilleure couverture a11y Angular de l'écosystème ;
- Angular Material 3 supporte nativement les CSS custom properties (`--mat-*`) ;
- harness de test Angular CDK (`@angular/cdk/testing`) pour composants UI ;
- standalone components supportés depuis Angular 14+, complets depuis Angular 17 ;
- lock-in faible (CDK est quasi-natif Angular, maintenu par la même équipe) ;
- intégration avec Reactive Forms (form fields, error states, validators).

Inconvénients :

- identité visuelle Material 3 visible par défaut si les tokens Enistere ne sont pas appliqués ;
- personnalisation profonde du système de thème Material nécessite `@include mat.theme()`
  ou `mat.define-theme()` avec les palettes Enistere ;
- le bundle inclut des composants Material stylés en plus du CDK — weight supérieur à CDK seul.

### Option B — PrimeNG (seul)

Utiliser PrimeNG (bibliothèque UI Angular enterprise) comme bibliothèque principale.

Avantages :

- plus de 80 composants enterprise : tables avancées, schedulers, editors, tree, virtualScroller ;
- PrimeNG 18+ introduit le mode "unstyled" et un système de design tokens CSS — plus flexible ;
- communauté large, documentation riche, stabilité ;
- orienté applications enterprise, adapté à des dashboards complexes.

Inconvénients :

- dépendance tierce hors écosystème Angular officiel (PrimeTek) — risque d'abandon ou virage
  majeur incontrôlé ;
- pas d'équivalent du test harness CDK (`@angular/cdk/testing`) — tests composants moins outillés ;
- a11y historiquement en retard sur Angular CDK (en amélioration, mais pas à parité) ;
- ne remplace pas le CDK pour les primitives comportementales (focus management, overlays, etc.)
  — nécessiterait d'installer `@angular/cdk` **en plus** de PrimeNG ;
- double dépendance (CDK + PrimeNG) sans gain net par rapport à CDK + composants maison ;
- couplage plus fort à un vendeur unique (PrimeTek) pour des composants qui pourraient être
  couverts par CDK + wrappers légers.

### Option C — Composants maison purs (sans CDK/Material)

Construire tous les composants UI Angular from scratch, sans s'appuyer sur Angular Material
ni PrimeNG comme couche de base.

Avantages :

- contrôle visuel maximal ;
- mapping direct avec les tokens Enistere ;
- aucune dépendance UI externe.

Inconvénients :

- coût de développement prohibitif : l'accessibilité complète (Dialog ARIA, FocusTrap, menus,
  combobox, date pickers conformes WCAG) représente des centaines de jours-homme ;
- risque élevé d'implémentations a11y incorrectes ou incomplètes ;
- pas de test harness dédié ;
- maintenance à très long terme sur des briques que l'écosystème Angular gère déjà ;
- réinvention injustifiée d'une roue déjà validée et maintenue.

Rejetée sans conditions.

### Option D — Angular Material (CDK + Material 3) contrôlé par tokens Enistere + composants maison ciblés ✅

Utiliser Angular Material comme **moteur comportemental et a11y**, contrôlé par les tokens
Enistere (ADR-008) via le système de thème Angular Material 3, et y superposer des composants
maison Enistere pour les patterns spécifiques à la Foundation.

L'approche est **identique dans sa logique** à ADR-034 côté Flutter : le moteur établi (Material)
n'est pas l'identité visuelle autonome — les tokens Enistere pilotent les variables CSS exposées
par Material 3, alignés sur les variables `--enistere-*` du UI Kit.

Avantages :

- CDK Angular comme couche a11y de référence (FocusTrap, LiveAnnouncer, Overlay,
  ListKeyManager, VirtualScroll) — aucune alternative Angular ne fait mieux ;
- Angular Material 3 expose des CSS custom properties (`--mat-sys-primary`, `--mat-sys-surface`,
  `--mat-sys-color-scheme`, etc.) directement pilotables depuis les tokens Enistere ;
- composants maison Enistere construits sur les primitives CDK (`CdkDialog`, `CdkMenu`,
  `CdkCombobox`, `CdkListbox`) — comportements corrects sans effort de réimplémentation a11y ;
- Angular Material sélectif pour les composants complexes où le CDK seul est insuffisant
  (DatePicker, Autocomplete, Snackbar) — pas d'interdiction sur ces briques ;
- `@angular/cdk/testing` : harness de test Angular officiel, testable sans navigateur ;
- lock-in minimal : CDK = pratiquement Angular Core, pas un tier-party ;
- cohérence avec ADR-034 (Flutter) et ADR-008 (tokens) — même philosophie : moteur établi,
  identité Enistere par-dessus ;
- Reactive Forms intégré nativement dans Angular Material (form fields, error display, validators) ;
- standalone components supportés par Angular Material 17+ — conforme aux standards §20 ;
- pas de shadcn/Radix côté Angular (bibliothèques React uniquement) ;
- tokens Enistere = source de vérité unique partagée entre UI Kit Web React, Mobile Flutter
  et Angular — ADR-008 honoré sans duplication.

Inconvénients :

- bundle légèrement supérieur à CDK seul (Material inclus) — acceptable pour des applications
  enterprise Angular, type cible de `web-angular` ;
- personnalisation des palettes Material 3 requiert la configuration de `mat.define-theme()`
  ou `mat.theme()` avec les palettes dérivées des tokens Enistere — surcoût de configuration
  initial, pas de surcoût d'exploitation.

## 7. Comparaison

| Critère | A — Material libre | B — PrimeNG | C — Maison pur | D — CDK+M3 tokens Enistere ✅ |
|---|---|---|---|---|
| Alignement tokens ADR-008 | ⚠️ partiel | ⚠️ partiel (PrimeNG 18+) | ✅ total | ✅ total |
| Accessibilité (a11y) | ✅ CDK | ⚠️ partiel | ✗ coût prohibitif | ✅ CDK complet |
| Test harness | ✅ CDK testing | ✗ absent | ✗ absent | ✅ CDK testing |
| Identité visuelle contrôlée | ⚠️ Material par défaut | ⚠️ PrimeNG par défaut | ✅ total | ✅ tokens pilotent tout |
| Coherence ADR-034 Flutter | ⚠️ partielle | ✗ non | ⚠️ partielle | ✅ logique identique |
| Lock-in vendor | faible (Angular) | moyen (PrimeTek) | nul | faible (Angular CDK) |
| Reactive Forms | ✅ natif | ✅ compatible | ✅ manuel | ✅ natif + CDK form field |
| Standalone components | ✅ Angular 17+ | ✅ | ✅ | ✅ Angular 17+ |
| Pas de shadcn/Radix Angular | ✅ | ✅ | ✅ | ✅ |
| Coût de maintenance a11y | faible | moyen | très élevé | faible |
| Composants maison Enistere | aucun | aucun | tout | ciblés (patterns Enistere) |

## 8. Non-objectifs

Cette ADR ne crée aucun projet Angular, aucun starter, aucun fichier Angular, aucune
dépendance npm, aucun composant implémenté, aucun workflow CI. Elle ne modifie pas l'UI Kit
Web React, le Web Core Next.js, le Mobile Core React Native, le Mobile Core Flutter, les
API Cores ou le Cloud Core.

Cette ADR ne tranche pas le choix d'adaptateur client HTTP Angular (Orval Angular vs OpenAPI
Generator `typescript-angular`) — cette décision est réservée à l'évaluation par preuve dans
le Web Core Angular (ADR-016 §F).

Cette ADR ne choisit pas entre Angular Signals et NgRx pour le state management — ce choix
dépend de la complexité de l'application dérivée et est réservé au Web Core Angular 1
(Core specification).

## 9. Décision

**Option D retenue : Angular Material (CDK + Material 3) contrôlé par tokens Enistere
+ composants maison ciblés.**

### 9.1 Moteur UI

Angular Material (`@angular/material` + `@angular/cdk`) est le moteur UI retenu pour
Web Core Angular. Ce n'est pas l'identité visuelle autonome : Material 3 est utilisé
comme infrastructure comportementale et a11y, pas comme design system Enistere.

### 9.2 Tokens Enistere (ADR-008)

Les tokens Enistere (couleurs, typographie, espacements, rayons, ombres, z-index, motion)
pilotent la personnalisation Angular Material 3 :

- `mat.define-theme()` ou `mat.theme()` avec des palettes dérivées des hex Enistere ;
- CSS custom properties `--enistere-*` alignées avec les variables `--mat-sys-*` exposées
  par Material 3 ;
- dark/light modes pilotés par le même jeu de tokens que le UI Kit Web React.

Les tokens Enistere restent la source de vérité UI unique (ADR-008) : Angular ne définit
pas ses propres valeurs de design, il consomme les tokens de la Foundation.

### 9.3 Composants maison Enistere Angular

Des composants Angular maison sont construits pour les patterns spécifiques à la Foundation
(states UI — LoadingState, EmptyState, ErrorState, SuccessState — analogues aux primitives
UI Kit 6 et Flutter 10) et pour tout pattern métier non couvert par Angular Material.

Ces composants :

- s'appuient sur les primitives CDK pour les comportements (overlays, focus, list navigation) ;
- ne dupliquent pas l'UI Kit Web React (pas de port shadcn/Radix côté Angular) ;
- exposent des APIs Angular idiomatiques (inputs/outputs, directives, standalone) ;
- sont testés via `@angular/cdk/testing` ou le framework de test natif Angular.

### 9.4 Formulaires

**Reactive Forms est obligatoire** pour Web Core Angular (standard `08_STANDARDS.md §20`,
`06_DEPENDENCY_STRATEGY.md §9.5`). Template-driven forms sont tolérés uniquement pour des
formulaires triviales dans des composants auto-contenus de faible complexité.

Angular Material form field components (`mat-form-field`, `mat-error`, `mat-label`) sont
utilisés avec Reactive Forms pour la cohérence stylistique pilotée par tokens.

### 9.5 Tables, dialogs et feedback states

- **Tables** : `mat-table` (Angular Material) ou `CdkTable` (CDK seul) selon complexité ; pas
  de PrimeNG `p-table`.
- **Dialogs** : `MatDialog` ou `CdkDialog` selon le niveau de personnalisation requis.
- **Feedback states** : composants maison Enistere Angular alignés sur les tokens ADR-008
  (analogue à LoadingState/EmptyState/ErrorState/SuccessState du UI Kit 6 et Flutter 10).
- **Snackbar/toast** : `MatSnackBar` ou wrapper Enistere sur CDK Overlay.

### 9.6 Accessibilité (a11y)

`@angular/cdk/a11y` est la couche d'accessibilité de référence pour Web Core Angular :

- `FocusTrap` pour les modales et dialogs ;
- `LiveAnnouncer` pour les annonces aux lecteurs d'écran (états UI, erreurs) ;
- `FocusMonitor` pour la gestion du focus visible ;
- `ListKeyManager` pour la navigation clavier dans les listes ;
- labels, roles ARIA et attributs d'état via les composants Material ou via templates Angular.

Les composants maison Enistere Angular **doivent respecter les standards WCAG 2.1 AA** :
contraste suffisant (tokens ADR-008 validés), focus visible, alternative textuelle, navigation
clavier, annonces lecteurs d'écran via `LiveAnnouncer`.

### 9.7 Tests

- **Tests unitaires composants** : `@angular/cdk/testing` (harness) + `TestBed` Angular.
- **Tests E2E** : Cypress ou Playwright (décision réservée au Web Core Angular 1 — Core
  specification ; `06_DEPENDENCY_STRATEGY.md §9.12` : "Angular: Cypress ou Playwright").
- Tests unitaires Angular : Jasmine/Karma (intégré Angular CLI) ou Jest (décision réservée
  au Web Core Angular 1 selon `06_DEPENDENCY_STRATEGY.md §9.12`).

### 9.8 State management et server state

- **State local UI** : Angular Signals (Angular 17+) préférés pour la réactivité simple ;
  NgRx réservé aux applications dérivées à état global complexe (décision projet dérivé).
- **Server state** : RxJS services + éventuel TanStack Query Angular si validé par preuve
  dans Web Core Angular (`06_DEPENDENCY_STRATEGY.md §9.3`). Pas de décision forcée ici.
- **Formulaires** : Reactive Forms (§9.4 ci-dessus).

### 9.9 Client HTTP et adaptateur OpenAPI

Le client HTTP Angular utilise nativement `HttpClient` (Angular DI, intercepteurs). L'adaptateur
OpenAPI spécifique à Angular (Orval Angular ou OpenAPI Generator `typescript-angular`) est
évalué **par preuve** dans le Web Core Angular (ADR-016 §F) — cette ADR ne tranche pas ce choix.

## 10. Impact

### 10.1 Web Core Angular

Le Web Core Angular peut désormais démarrer :

- **Web Core Angular 1 — Core specification** est la prochaine action (analogue à Mobile
  Flutter 1 — Core specification après ADR-034) ;
- la spécification peut poser la structure feature-first, les modules Reactive Forms,
  le thème Material 3 piloté par tokens, les composants maison et les décisions tests/state ;
- aucun starter Angular ne peut être généré avant la spécification.

### 10.2 UI Kit

L'UI Kit Web React (`@enistere/ui-kit`) **n'est pas étendu côté Angular** dans cette ADR.

Les tokens Enistere (`cores/ui-kit/tokens/`) sont la source de vérité partagée : Angular
consomme les valeurs hex/rem/ms directement depuis les tokens de la Foundation, exactement
comme Flutter (ADR-034 §9.3) et React Native (ADR-010).

Une surface Angular de l'UI Kit (`@enistere/ui-kit/angular`) peut être envisagée en V3
avancée ou VF, mais n'est pas décidée ici.

### 10.3 ADR-016 — Client OpenAPI Angular

ADR-016 §F reste ouvert : l'adaptateur Angular (Orval Angular ou `typescript-angular`) est
évalué par preuve dans le Web Core Angular. La décision ADR-035 confirme le contexte Angular
(HttpClient/DI) qui justifie un adaptateur spécifique plutôt que `openapi-fetch` (Fetch seul).

### 10.4 Roadmap V3

`web-angular` passe de **`DOSSIER_SEULEMENT`** à une situation où la spécification peut
commencer. La prochaine action est **Web Core Angular 1 — Core specification**.

Les décisions Angular non tranchées (adaptateur OpenAPI, tests E2E, TanStack Query Angular,
NgRx vs Signals, store de préférences) sont réservées à la spécification et au starter Angular.

## 11. Règle d'application

Cette décision est **imposée** : un projet dérivé utilisant le futur Web Core Angular n'arbitre
pas librement entre Angular Material et PrimeNG. Il applique la stack CDK + Material 3
contrôlée par tokens Enistere, avec les composants maison ciblés.

PrimeNG est **interdit comme bibliothèque UI principale** dans les cores Foundation Angular.
Il peut être considéré dans un projet dérivé spécifique sous condition de justification
architecturale formelle (décision projet, pas Foundation).

shadcn/ui, Radix UI et NativeWind sont **interdits côté Angular** (écosystèmes React/React
Native exclusivement, conformément à ADR-009 et ADR-010).

## 12. Cohérence multi-framework

| Framework | Moteur UI | Identité visuelle | Source tokens |
|---|---|---|---|
| React (Web) | shadcn/ui + Radix UI (ADR-009) | composants Enistere React | `ui-kit/tokens/` (ADR-008) |
| React Native | composants maison (ADR-010) | ThemeProvider Enistere | `ui-kit/tokens/` (ADR-008) |
| Flutter | Material 3 (ADR-034) | tokens Enistere via `ThemeData` | `ui-kit/tokens/` (ADR-008) |
| **Angular** | **CDK + Material 3 (ADR-035)** | **tokens Enistere via `mat.theme()`** | **`ui-kit/tokens/` (ADR-008)** |

Le principe est constant : le moteur établi de chaque plateforme fournit les primitives
comportementales et a11y ; les tokens Enistere (ADR-008) pilotent l'identité visuelle ;
les composants maison Enistere ajoutent les patterns spécifiques à la Foundation.
