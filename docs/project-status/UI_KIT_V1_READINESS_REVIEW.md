# UI_KIT_V1_READINESS_REVIEW.md — Revue de stabilité V1 du UI Kit

> **Date** : 2026-07-11
> **Branche** : `ui-kit-v1-readiness-review`
> **Scope** : revue officielle — aucun composant ajouté, aucun token modifié.

---

## 1. Synthèse

| Critère | Résultat |
|---|---|
| Statut proposé | **`IMPLEMENTATION_AVANCEE`** (depuis `IMPLEMENTATION_PARTIELLE`) |
| Critères roadmap §12.4 satisfaits | **3/4** (cohérence visuelle mobile/web = partielle) |
| Critères CORE_SPECIFICATION §59 satisfaits | **8/9** (compatibilité RN = documentée, non prouvée) |
| Tests UI Kit | **181/181** — 0 régression |
| Primitives Web | **19** — complètes pour le périmètre Web V1 |
| ADR-008 (tokens) | ✅ implémenté |
| ADR-009 (stack web) | ⚠️ partiel — Tailwind/Radix/shadcn hors package (intentionnel) |
| ADR-010 (stack RN) | ⚠️ partiel — tokens définis, composants RN absents (différés) |
| Consommé par un core | ✅ Web Core **VALIDE_V1** (états UI, Dialog, Alert, Card, FormField…) |
| Gaps bloquants VALIDE_V1 | **1** — composants React Native de base absents |
| Prochaine mission unique | **Mobile RN35** — aligner le starter mobile avec les états UI / UI Kit |

---

## 2. Contexte

Cette revue est réalisée après :
- **UI Kit 6** (2026-07-11) : ajout de `LoadingState`, `EmptyState`, `ErrorState`, `SuccessState`
- **Web Core UI 2** (2026-07-11) : remplacement des états génériques Web par les primitives UI Kit 6

Elle évalue si le UI Kit peut changer de statut (`IMPLEMENTATION_PARTIELLE` → statut plus stable) en
comparant l'état réel du repository aux critères de la roadmap §12, de la `CORE_SPECIFICATION.md` §59
et des ADR-008/009/010.

---

## 3. Analyse des critères — Roadmap §12 UI Kit minimal V1

### §12.2 Contenu V1

| Élément roadmap | État réel | Verdict |
|---|---|---|
| design tokens | `generated/tokens.json` + `generated/css/tokens.css` + `generated/typescript/tokens.ts` — primitives + sémantique + thèmes light/dark | ✅ PRÉSENT |
| couleurs | `--enistere-color-background-*`, `--enistere-color-foreground-*`, `--enistere-color-border-*`, `--enistere-color-status-{success,warning,danger,info}`, `--enistere-color-action-*` | ✅ PRÉSENT |
| typographie | `--enistere-font-*` (family/size/weight/line-height) ; primitive `Text` (variant display/heading/title/body/label/caption/code, tone) | ✅ PRÉSENT |
| spacing | `--enistere-spacing-*` (base 4 px, 1–20) | ✅ PRÉSENT |
| radius | `--enistere-radius-*` (sm/md/lg/full) | ✅ PRÉSENT |
| buttons | `Button` (variant primary/secondary/outline/ghost/danger, size sm/md/lg, loading, loadingText) | ✅ PRÉSENT |
| inputs | `Input` (size, invalid), `Select` (size, invalid), `FormField` (label+description+error associés) | ✅ PRÉSENT (core input/select/field ; Textarea/Checkbox/Radio/Switch différés) |
| cards | `Card` / `CardHeader` / `CardTitle` / `CardDescription` / `CardContent` / `CardFooter` | ✅ PRÉSENT |
| modals | `Dialog` / `DialogHeader` / `DialogTitle` / `DialogDescription` / `DialogContent` / `DialogFooter` (native `<dialog>`) | ✅ PRÉSENT |
| badges | `Badge` (variant neutral/info/success/warning/danger, size sm/md) | ✅ PRÉSENT |
| loading states | `LoadingState` + `Spinner` + `Skeleton` | ✅ PRÉSENT |
| empty states | `EmptyState` | ✅ PRÉSENT |
| error states | `ErrorState` | ✅ PRÉSENT |

Le contenu §12.2 est **intégralement présent** (13/13 catégories).

### §12.3 Livrables V1

| Livrable | État réel | Verdict |
|---|---|---|
| tokens documentés | README §§3–11, docs/components.md, `generated/typescript/tokens.ts` | ✅ |
| composants React Native de base | — aucun composant RN dans le package | ❌ **ABSENT** |
| composants Next.js de base | 19 primitives Web React ; consommées par Web Core VALIDE_V1 | ✅ |
| guidelines UX initiales | `docs/components.md` (documentation par composant, do/don't, a11y) | ✅ |

**Gap critique** : les composants React Native de base sont explicitement listés comme livrable V1 dans la roadmap §12.3. Ils sont absents. ADR-010 reporte leur implémentation dans le Mobile Core (ThemeProvider + composants maison), mais la roadmap, rédigée avant les ADR, les attendait dans le UI Kit.

### §12.4 Critères de validation V1

| Critère | État réel | Verdict |
|---|---|---|
| tokens définis | primitives + sémantique + thèmes + validation automatique | ✅ |
| composants principaux utilisables | 19 primitives Web, `forwardRef`, a11y, CSS var, pas de dépendance lourde | ✅ |
| composants documentés | `docs/components.md` (19 sections) + README §18 | ✅ |
| cohérence visuelle minimale entre mobile et web | tokens partagés par intention (ADR-008/010) ; **pas de composants RN réels** ; consommation RN = future ThemeProvider | ⚠️ **PARTIELLE** |

**Score §12.4 : 3/4.**

---

## 4. Analyse des critères — CORE_SPECIFICATION §59 Critères d'acceptation V1

| Critère spec §59 | État réel | Verdict |
|---|---|---|
| les tokens initiaux sont définis | 5 catégories primitives + sémantique + light/dark + validation + export JSON/TS/CSS | ✅ |
| les composants obligatoires prioritaires sont spécifiés | 19 primitives couvrent Button, Input, Label, Text, Spinner, VisuallyHidden, Alert, Card, FormField, Dialog, Select, Toast, Badge, Divider, Skeleton + 4 états UI | ✅ |
| les états UI standards sont définis | `LoadingState` / `EmptyState` / `ErrorState` / `SuccessState` — rôles ARIA, glyphes CSS, slots action | ✅ |
| l'accessibilité minimale est documentée | jest-axe couvre 19 primitives ; rôles ARIA, focus visible, `prefers-reduced-motion` documentés ; do/don't accessibilité dans `docs/components.md` | ✅ |
| les guidelines UX/UI de base existent | `docs/components.md` — description, props, exemples, a11y, do/don't, limites pour chaque primitive | ✅ |
| la compatibilité Mobile Core React Native est claire | ADR-010 documentée (tokens + ThemeProvider + composants maison) ; tokens numériques/couleurs hex exportables ; README §13 | ⚠️ **DOCUMENTÉE — NON PROUVÉE** |
| la compatibilité Web Core Next.js est claire | Web Core VALIDE_V1 consomme le UI Kit (Alert, Card, FormField, Dialog, Badge, Divider, Skeleton, LoadingState, EmptyState, ErrorState, SuccessState) | ✅ |
| aucune identité projet spécifique n'est imposée | tokens et composants génériques ; pas de logique métier, pas de marque | ✅ |
| la documentation minimale existe | README, CORE_SPECIFICATION.md, docs/components.md, CHANGELOG ; pas d'ARCHITECTURE.md (absence notée) | ✅ |

**Score §59 : 8/9.** La compatibilité Mobile Core React Native est documentée mais non prouvée par une implémentation concrète.

---

## 5. Analyse des ADR

### ADR-008 (design tokens) — ✅ IMPLÉMENTÉ

La stratégie tokens agnostiques, centralisés, versionnés est pleinement appliquée :
- Architecture primitives → sémantique → thèmes → generated/ conforme
- Parité light/dark vérifiée par test
- Export JSON/TypeScript/CSS déterministe
- Validation automatique (références circulaires, parité, hex invalide, etc.)
- SemVer respecté (pré-1.0, v0.1.1)

### ADR-009 (stack UI Web : Tailwind + Radix + shadcn) — ⚠️ PARTIEL (intentionnel)

L'ADR-009 retient Tailwind CSS + Radix UI + shadcn/ui comme stack web **du Web Core Next.js**, pas du package UI Kit. Le UI Kit choisit de rester CSS-only (variables `--enistere-*`) sans ces dépendances. C'est conforme à la décision : le UI Kit est **la source de vérité des tokens**, les cores clients implémentent la stack. Ce gap est **intentionnel et non bloquant**.

### ADR-010 (stack UI React Native : hybride contrôlée) — ⚠️ PARTIEL

ADR-010 retient tokens Enistere + ThemeProvider + composants maison. Le UI Kit fournit les tokens. Le ThemeProvider mobile et les composants maison n'existent pas encore dans le Mobile Core. Ce gap est le **principal gap V1 non comblé**.

---

## 6. État réel des primitives et tests

### 19 primitives exportées

```
V2 (initiales) : Button, Input, Label, Text, Spinner, VisuallyHidden
UI Kit 3 (Web UI 1) : Alert, Card, FormField
UI Kit 4 : Dialog, Select, Toast
UI Kit 5 : Badge, Divider, Skeleton
UI Kit 6 : LoadingState, EmptyState, ErrorState, SuccessState
```

### Qualifications techniques

| Vérification | Résultat |
|---|---|
| `npm run typecheck` | ✅ 0 erreur |
| `npm run lint` | ✅ 0 warning |
| `npm test` | ✅ **181/181** (0 fail, 0 skip) |
| `npm run build` | ✅ build propre |
| `npm run tokens:check` | ✅ up-to-date |
| `npm audit` | ✅ 0 vulnérabilité |
| `git diff --check` | ✅ propre |

### Composants obligatoires de la spec §22 — couverture actuelle

| Composant obligatoire (spec §22) | Statut |
|---|---|
| Button | ✅ |
| IconButton | ❌ absent |
| Input | ✅ |
| Textarea | ❌ absent |
| Select | ✅ |
| Checkbox | ❌ absent |
| Radio | ❌ absent |
| Switch | ❌ absent |
| FormField | ✅ |
| Label | ✅ |
| HelperText | ✅ (`FormFieldDescription`) |
| ErrorText | ✅ (`FormFieldError`) |
| Card | ✅ |
| Badge | ✅ |
| Avatar | ❌ absent |
| Divider | ✅ |
| Spinner | ✅ |
| Skeleton | ✅ |
| EmptyState | ✅ |
| ErrorState | ✅ |
| SuccessState | ✅ |
| Alert | ✅ |
| Toast | ✅ |
| Modal/Dialog | ✅ |
| ConfirmationDialog | ❌ absent (différé) |
| BottomSheet (mobile) | ❌ absent (mobile, différé) |
| Header | ❌ absent |
| AppBar | ❌ absent |
| Sidebar (web) | ❌ absent |
| Tabs | ❌ absent |
| Breadcrumbs | ❌ absent |
| ListItem | ❌ absent |
| SectionHeader | ❌ absent |
| ScreenContainer | ❌ absent (mobile) |
| PageContainer | ❌ absent |

La spec §22 liste 35 composants obligatoires. Le UI Kit actuel en couvre **16/35** — ce qui correspond à la priorité V1 définie dans la roadmap (composants principaux) plutôt qu'à la liste complète V2/VF de la spec. Ces manquants sont attendus et documentés dans `README.md §19`.

---

## 7. Gaps par catégorie

### Bloquants pour VALIDE_V1

| Gap | Source | Impact | Mitigation |
|---|---|---|---|
| Composants React Native de base absents (ThemeProvider, composants maison) | Roadmap §12.3 ; spec §50 | Cohérence mobile/web = intention seulement | ADR-010 prévoit l'implémentation dans le Mobile Core ; tokens sont prêts |

Ce gap est le **seul bloquant** pour `VALIDE_V1`. Il n'est pas un bug ou une dette technique — c'est une mise en œuvre différée par décision architecturale (ADR-010). La résolution appartient au Mobile Core React Native (ThemeProvider + primitives) et non au package UI Kit Web.

### Non-bloquants (différés ou intentionnels)

| Gap | Raison du report | Criticité |
|---|---|---|
| Tailwind/Radix/shadcn absents du package | ADR-009 : ces stacks vivent dans les cores clients ; le UI Kit reste CSS-only | Intentionnel |
| Storybook / documentation visuelle | Spec §43 : "pourra être ajoutée plus tard" ; choix par ADR futur | Non-bloquant V1 |
| Contrastes calculés non vérifiés | jsdom ne peut pas calculer les contrastes réels ; `jest-axe` couvre la structure | Non-bloquant (mesure externe) |
| Icônes absentes | Spec §15 : "le choix exact de librairie doit être validé" | Non-bloquant V1 |
| `ARCHITECTURE.md` absent | Contenu couvert par README §§3–11 ; roadmap n'exige pas ce fichier en V1 | Mineur |
| Textarea, Checkbox, Radio, Switch, Avatar absents | Différés spec §22 ; non listés dans roadmap §12.2 | Non-bloquant V1 |
| `danger` sans hover/pressed dédiés | Documenté README §18 | Mineur |
| ESLint complet (monorepo) | README §18 : "aligné plus tard au niveau monorepo" | Non-bloquant V1 |

---

## 8. Statut proposé et justification

### Statut proposé : `IMPLEMENTATION_AVANCEE`

**Justification :**

Le UI Kit a dépassé `IMPLEMENTATION_PARTIELLE` car :
1. Les **tokens** sont complets, validés, versionnés et exportables (ADR-008 ✅).
2. **19 primitives Web** — accessibles, testées (181 tests), documentées, pilotées par tokens, sans dépendance lourde.
3. Les **4 états UI standards** (LoadingState/EmptyState/ErrorState/SuccessState) sont présents (roadmap §12.2 ✅).
4. Le UI Kit est **réellement consommé et prouvé** dans le Web Core VALIDE_V1.
5. Toutes les **qualifications techniques** sont vertes (typecheck, lint, build, tokens:check, audit, diff --check).

Il ne peut pas prétendre à `VALIDE_V1` car :
1. Les **composants React Native de base** (roadmap §12.3 — "composants React Native de base") sont absents.
2. La **cohérence visuelle mobile/web** reste à l'intention des tokens (ADR-010 partiel) et non à la preuve.

`IMPLEMENTATION_AVANCEE` traduit précisément cette position : le socle Web de la V1 est complet et prouvé, mais la dimension mobile — explicitement attendue par la roadmap §12 — reste à construire dans le Mobile Core.

### Comparaison avec les autres statuts envisagés

| Statut | Raison de rejet |
|---|---|
| `VALIDE_V1` | Gap bloquant : composants RN de base absents (roadmap §12.3) |
| `STARTER_UI_READY` | Terme trop informel ; non défini dans la légende officielle des statuts |
| `IMPLEMENTATION_PARTIELLE` | Sous-évalue l'état réel : 19 primitives Web + états UI + consommation prouvée |

---

## 9. Prochaine mission unique : **Mobile RN35**

### Objectif

Aligner le starter Mobile React Native avec les états UI / UI Kit en consommant les tokens Enistere
dans le ThemeProvider mobile existant et en ajoutant des primitives d'état (loading/empty/error) au
starter.

### Pourquoi Mobile RN35 plutôt que UI Kit 7 ou Quality Core 1

**UI Kit 7** serait justifié si un gap V1 bloquant requérait un nouveau composant **dans le package Web**.
Ce n'est pas le cas : le gap bloquant (RN) appartient au Mobile Core, pas au UI Kit.

**Quality Core 1** serait justifié si le socle était « suffisamment stable » pour industrialiser.
Or le Mobile Core n'a pas encore fermé sa V1 (pas de ThemeProvider basé sur les tokens, pas d'états UI
standardisés) — il serait prématuré de passer en industrialisation.

**Mobile RN35** est la prochaine étape naturelle car :
- Il ferme le seul gap bloquant V1 du UI Kit (cohérence mobile/web).
- Il utilise les tokens UI Kit déjà disponibles (pas de nouveau composant UI Kit).
- Il aligne le starter Mobile avec les conventions de feedback UI (LoadingState/EmptyState/ErrorState)
  déjà présentes en Web.
- Après RN35, le UI Kit peut prétendre à `VALIDE_V1` : la preuve mobile/web sera établie.

### Périmètre RN35 (indicatif)

```
- Consommer les tokens numériques et couleurs du UI Kit dans le ThemeProvider mobile existant
- Ajouter des primitives d'état (LoadingView, EmptyView, ErrorView) dans le starter mobile
  basées sur les tokens (pas de copie du code Web — React Native != React DOM)
- Documenter la cohérence web/mobile (même intentions, implémentation platform-native)
- Aucun nouveau composant UI Kit, aucune nouvelle dépendance
```

---

## 10. Vérifications effectuées

```
npm run typecheck --workspace=@enistere/ui-kit  ✅ 0 erreur
npm run lint --workspace=@enistere/ui-kit        ✅ 0 warning
npm test --workspace=@enistere/ui-kit            ✅ 181/181 pass
npm run build --workspace=@enistere/ui-kit       ✅ build propre
npm run tokens:check --workspace=@enistere/ui-kit ✅ up-to-date
npm audit (workspace ui-kit)                     ✅ 0 vulnérabilité
git diff --check                                 ✅ propre
```

Fichiers lus : `strategy/04_ROADMAP_GLOBAL.md` §12, `cores/ui-kit/CORE_SPECIFICATION.md` §§22/33/34/59,
`cores/ui-kit/README.md`, `cores/ui-kit/docs/components.md`, `docs/adr/ADR-008/009/010`,
`docs/project-status/FOUNDATION_CURRENT_STATE.md`, `docs/project-status/IMPLEMENTATION_MATRIX.md`,
`docs/project-status/NEXT_ACTIONS.md`, `docs/project-status/SESSION_HANDOFF.md`.
Note : `cores/ui-kit/ARCHITECTURE.md` absent du repository (non bloquant — contenu couvert par README).
