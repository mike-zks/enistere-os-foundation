# @enistere/ui-kit

> **Statut : STARTER_INITIALISE.** Socle technique des **design tokens** Enistere (ADR-008) — source de
> vérité UI, agnostique et versionnée. **Privé / non publié** (`0.1.0`). **Aucun composant, aucun
> framework UI** (ni React, ni React Native, ni Tailwind/Radix/shadcn/NativeWind). V1 = tokens only.

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

V1 = **tokens uniquement**. Pas de composant, pas de Storybook, pas d'icônes, pas de docs visuelles.
Breakpoints orientés Web (non directement applicables à React Native). ESLint complet aligné plus tard
au niveau monorepo (lint léger zéro-dépendance pour l'instant). Accessibilité : contrastes pensés au
niveau des tokens sémantiques, à vérifier par des tests dédiés en V2.

## 19. Non implémenté (volontaire)

Composants, ThemeProvider, adaptateurs Tailwind/Radix/shadcn/NativeWind, Storybook/Ladle, icônes,
documentation visuelle, publication npm — réservés aux missions et ADR ultérieurs.

## 20. Sécurité

Tokens = données de présentation uniquement : aucun secret, aucun token d'authentification, aucune
donnée métier, aucune URL, aucune logique. Les artefacts générés ne contiennent ni date, ni chemin
absolu, ni hostname, ni secret.
