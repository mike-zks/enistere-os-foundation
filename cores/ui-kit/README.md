# @enistere/ui-kit

> **Statut : IMPLEMENTATION_PARTIELLE.** Design tokens Enistere (ADR-008, source de vérité) **+
> 15 primitives Web accessibles** (React) — UI Kit V2/4/5. **Privé / non publié** (`0.1.1`). **Pas de
> bibliothèque complète**, **pas de Tailwind/Radix/shadcn/NativeWind dans le package** (ADR-009/010 :
> ces stacks vivent dans les cores clients ; le UI Kit reste piloté par les tokens).

## Installation (workspace) & usage

`react` est une **peerDependency** (`>=18`) — fournie par l'application consommatrice. Les composants
ne dépendent **pas** de `react-dom` (le consommateur l'a déjà), ni de Next.js, ni de React Native.

> **Compatibilité React 19 (v0.1.1).** Le UI Kit est développé et **testé sous React 19** (les
> **146 tests** passent, 0 régression) ; la peerDependency reste `react >=18`, donc **React 18 et 19
> sont tous deux supportés**. Les primitives statiques restent consommables depuis les Server
> Components ; `Dialog` est explicitement marqué **Client Component** (`'use client'`) car il utilise
> des hooks pour piloter le `<dialog>` natif. Alignement vérifié avec le **Web Core Next.js** (Next 16 /
> React 19).

```ts
import { Button, Input, Label, Text, Spinner, VisuallyHidden } from '@enistere/ui-kit';
import { Alert, Card, CardHeader, CardTitle, CardContent, FormField, FormFieldLabel } from '@enistere/ui-kit';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@enistere/ui-kit';
import { Select } from '@enistere/ui-kit';
import { Toast, ToastRegion } from '@enistere/ui-kit';
import { Badge, Divider, Skeleton } from '@enistere/ui-kit';
import '@enistere/ui-kit/styles.css'; // tokens + styles des primitives (une seule feuille)
```

Le thème sombre s'active via un ancêtre `data-theme="dark"` (le package n'impose aucun JS de thème) :

```html
<html data-theme="dark"> … </html>
```

## Primitives Web (V2 + Web UI 1 + UI Kit 4 + UI Kit 5)

**Quinze** primitives accessibles, **pilotées par les tokens** (variables `--enistere-*`), sans valeur magique :

- **Button** — `variant` (primary/secondary/outline/ghost/danger), `size` (sm/md/lg), `loading`,
  `loadingText`. `type="button"` par défaut, désactivé réel en `loading` (donc pas d'`onClick`),
  `aria-busy`, spinner décoratif (jamais annoncé deux fois).
- **Input** — `size`, `invalid` (→ `aria-invalid`). Transmet tous les attributs natifs ; `forwardRef`.
  Aucune logique de formulaire (label/erreur/description viendront avec un `Field` ultérieur).
- **Label** — `<label>` natif, `htmlFor` transmis, indicateur requis **décoratif** (`aria-hidden`).
- **Text** — `variant` (display/heading/title/body/label/caption/code), `tone`
  (default/muted/inverse/success/warning/danger/info), `as` (élément choisi par le consommateur).
- **Spinner** — autonome (`role="status"` + libellé) ou `decorative` (`aria-hidden`) ; respecte
  `prefers-reduced-motion`.
- **VisuallyHidden** — masque visuellement en restant accessible (technique sr-only, pas `display:none`).
- **Alert** — message générique : `variant` (info/success/warning/danger), `title?`, `role?`. Rôle par
  défaut `status` (poli) sauf `danger` → `alert` ; variante conveyée par **glyphe + bordure + titre** (jamais
  la couleur seule). **Sans connaissance HTTP/Auth.**
- **Card** — conteneur structurel (`Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter`).
  `CardTitle` **n'impose aucun niveau** (`as`, défaut `p`). Aucune logique métier.
- **FormField** — association **explicite** label/champ/aide/erreur (`FormField`/`FormFieldLabel`/
  `FormFieldDescription`/`FormFieldError`) ; **pas d'injection magique** (le consommateur câble
  `htmlFor`/`id`/`aria-describedby`/`aria-invalid`).
- **Dialog** — modale `<dialog>` native (`showModal()`/`close()`) — focus trap, ESC et backdrop fournis
  nativement. Props : `open` (booléen contrôlé), `onDismiss`. Sous-composants : `DialogHeader`,
  `DialogTitle` (prop `as`, défaut `h2`), `DialogDescription`, `DialogContent`, `DialogFooter`.
  `aria-modal="true"`. **Pas de Radix/Portal.**
- **Select** — `<select>` natif dans un `<span>` wrapper + chevron CSS-only (aucune image, aucun SVG).
  Props : `size` (sm/md/lg), `invalid` (→ `aria-invalid`). `forwardRef` cible le `<select>` ;
  `className`/`style` vont sur le `<span>` wrapper pour le layout.
- **Toast** / **ToastRegion** — notification non-modale. `variant` (info/success/warning/danger) →
  ARIA (`role="alert"` + `aria-live="assertive"` pour `danger` ; `role="status"` + `aria-live="polite"`
  sinon) + `aria-atomic="true"`. `ToastRegion` : conteneur positionné (6 positions top/bottom ×
  left/center/right), `aria-label="Notifications"`. **Aucun timer** — le consommateur gère le cycle de vie.
- **Badge** — étiquette courte `<span>` inline. `variant` (neutral/info/success/warning/danger), `size`
  (sm/md). Fond `background-muted` + couleur statut texte/bordure. `user-select:none`.
- **Divider** — séparation `<div>`. `orientation` (horizontal/vertical). Décoratif par défaut
  (`aria-hidden`). Avec `label` → `role="separator"` + `aria-orientation` + deux lignes flanquant
  le libellé. Aucun enfant autorisé sans `label`.
- **Skeleton** — placeholder de chargement `<div>`. `variant` (text/block/circle). Toujours
  `aria-hidden="true"` (l'état de chargement est annoncé par un `role="status"` parent). Animation
  `pulse` CSS uniquement si `prefers-reduced-motion: no-preference`.

```tsx
<Button variant="primary" size="md" loading loadingText="Envoi…">Envoyer</Button>
<Label htmlFor="email" required>Email</Label>
<Input id="email" type="email" invalid placeholder="jean@example.com" />
<Text as="h1" variant="display">Titre</Text>
<Spinner label="Chargement…" />
```

Tous : acceptent `className`, transmettent les attributs HTML pertinents, exposent `ref` (forwardRef),
sont accessibles par défaut, et n'embarquent aucune logique métier. Détail : [`docs/components.md`](docs/components.md).

### Web vs Mobile

Ces composants sont **Web (React + DOM)**. Le Mobile React Native (ADR-010) partage les **tokens et
intentions**, **pas** les composants : il aura ses propres primitives (ThemeProvider/StyleSheet).

## 1. Rôle

Fournir des design tokens **communs, agnostiques, centralisés, versionnés et exportables**, consommés à
terme par le Web Core Next.js, le Mobile Core React Native et les futurs cores Flutter/Angular — chacun
adaptant l'implémentation à sa plateforme, **sans redéfinir une source de vérité indépendante**.

## 2. ADR appliqués

- **ADR-008** (design tokens) : primitives → sémantique → thèmes, light/dark, export JSON, versionné.
- **ADR-009** (stack UI Web : Tailwind/Radix/shadcn) : **futur** — aucune de ces dépendances ici.
- **ADR-010** (stack UI React Native : tokens + ThemeProvider + maison) : **futur** — aucune dépendance RN ici.

## 3. Architecture des tokens

```
primitives  (valeurs brutes agnostiques)
   ↓ référencées par
themes       (light/dark : chaque couleur sémantique → une primitive)
   ↓ résolus en
sémantique   (intentions : background/foreground/border/action/status/focus/overlay)
   ↓ sérialisés en
generated/   (artefacts JSON · TypeScript · CSS, déterministes)
```

Les composants futurs utilisent les **tokens sémantiques** (ex. `action.primary`), jamais les
primitives directement (ex. `brand.600`), sauf exception documentée.

## 4. Primitives

`color` (neutral 0–950, brand 50–950, red/green/amber/blue), `spacing` (base 4 px), `radius`,
`typography` (fontFamily/fontSize/fontWeight/lineHeight/letterSpacing), `shadow` (structurée),
`motion` (duration ms + easing cubic-bézier), `breakpoint` (Web), `zIndex`.

## 5. Tokens sémantiques

Couleurs : `background.{default,muted,elevated}`, `foreground.{default,muted,inverse}`,
`border.{default,strong,focus}`, `action.{primary,primaryHover,primaryPressed,disabled}`,
`status.{success,warning,danger,info}`, `focus.ring`, `overlay`. Typographie : `display`, `heading`,
`title`, `body`, `label`, `caption`, `code`.

## 6. Thèmes

`lightTheme` et `darkTheme` partagent **exactement le même contrat de clés** (vérifié par test). Chaque
couleur est **résolue** depuis une primitive (aucune valeur hex en dur dans les thèmes).

## 7. Unités canoniques

Dimensions = **nombres en px canoniques** (Web : `px` ; React Native : nombre brut). Couleurs = **hex**.
`lineHeight` = ratio sans unité. `duration` = ms. `shadow` = **structure** (jamais une chaîne CSS).
`easing` = courbe cubic-bézier. L'adaptation plateforme appartient aux générateurs et aux cores.

## 8. Génération

```bash
npm run tokens:validate   # valide les tokens (aucune écriture)
npm run tokens:generate   # build + valide + génère generated/{tokens.json, typescript/tokens.ts, css/tokens.css}
npm run tokens:check      # build + régénère en temp + compare à generated/ (RC=1 si divergence)
```

Génération **déterministe** : deux exécutions = fichier identique (aucune date/chemin/hostname/secret).

## 9. Validation

`validateTokens(model)` détecte : clés vides/invalides, valeurs `undefined`, couleurs hex invalides,
nombres non finis / unités invalides, **parité des clés light/dark**, références non résolues,
**références circulaires**, conventions de nommage. `validateDefaultTokens()` valide le modèle du package.

## 10. Imports (TypeScript)

```ts
import { tokens, lightTheme, darkTheme, validateDefaultTokens } from '@enistere/ui-kit';
import type { ThemeTokens, SemanticColors, ShadowToken } from '@enistere/ui-kit';

lightTheme.colors.action.primary; // string '#...'
tokens.typography.body.fontSize;  // number (px)
```

## 11. CSS

```ts
import '@enistere/ui-kit/tokens.css';
```

Variables préfixées `--enistere-`, kebab-case ; **light par défaut dans `:root`**, **dark via
`[data-theme="dark"]`**. Aucun reset, aucune police téléchargée, aucun style global.

```css
:root { --enistere-color-background-default: #FFFFFF; --enistere-spacing-4: 16px; }
[data-theme="dark"] { --enistere-color-background-default: #020617; }
```

## 12. Usage Web futur (ADR-009)

Les variables CSS alimenteront Tailwind (theme via `var(--enistere-*)`), Radix/shadcn et les thèmes
light/dark. Ces dépendances **ne sont pas** ajoutées tant qu'ADR-009 n'est pas implémentée.

## 13. Usage React Native futur (ADR-010)

Les tokens numériques (nombres) et couleurs (chaînes) alimenteront un `ThemeProvider` + StyleSheet
maison ; les ombres structurées mappent `shadow*`/`elevation`. NativeWind reste optionnel par projet.

## 14. Règles d'extension

- Ne **pas** modifier `generated/` à la main (régénérer via `tokens:generate`).
- Ajouter une primitive seulement si nécessaire ; privilégier les tokens **sémantiques**.
- Conserver des **clés identiques** entre light et dark.
- Pas de token **métier** ni de valeur magique dans les futurs composants.
- Documenter tout breaking change ; vérifier Web et Mobile avant stabilisation.

## 15. Versionnement

SemVer (pré-1.0 actuellement). Breaking changes de tokens (suppression/renommage de clé, changement de
valeur sémantique structurante) → montée de version + CHANGELOG. La `version` figure dans `tokens.json`.

## 16. Breaking changes (tokens)

Considérés cassants : suppression/renommage d'une clé sémantique, changement d'unité canonique,
suppression d'un thème, rupture de parité light/dark. Compatibles : ajout de primitive/clé sémantique,
nouvelle valeur cohérente.

## 17. Commandes

`build`, `typecheck`, `lint`, `test`, `test:coverage`, `tokens:validate`, `tokens:generate`,
`tokens:check`, `pack:check`, `clean`.

## 18. Limites actuelles

UI Kit 5 = tokens + **15 primitives Web** (Button/Input/Label/Text/Spinner/VisuallyHidden/Alert/Card/FormField + Dialog/Select/Toast + Badge/Divider/Skeleton). Pas de bibliothèque complète, pas de Storybook, pas d'icônes, pas de docs visuelles. `danger` n'a pas (encore) de teinte hover/pressed dédiée dans les tokens. Breakpoints orientés Web. ESLint complet aligné plus tard au niveau monorepo (lint léger zéro-dépendance). Accessibilité : `jest-axe` couvre toutes les primitives ; les **contrastes** réels (calculés) restent à vérifier (non calculables sous jsdom). Tests composants : `node:test` + `global-jsdom` + Testing Library (**146 tests**, un seul runner, **0 vulnérabilité**).

## 19. Non implémenté (volontaire)

Modal, Drawer, Combobox, Dropdown, Table, Pagination, Form complet, DatePicker, Upload, navigation ;
`asChild`/polymorphisme Radix ; ThemeProvider ; adaptateurs Tailwind/Radix/shadcn/NativeWind ;
Storybook/Ladle ; icônes ; documentation visuelle ; publication npm — réservés aux missions et ADR
ultérieurs. Composants Web ≠ React Native.

## 20. Sécurité

Tokens = données de présentation uniquement : aucun secret, aucun token d'authentification, aucune
donnée métier, aucune URL, aucune logique. Les artefacts générés ne contiennent ni date, ni chemin
absolu, ni hostname, ni secret.
