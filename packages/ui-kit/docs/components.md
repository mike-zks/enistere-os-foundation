# Primitives Web du UI Kit (V2)

> Documentation légère des **19 primitives** (6 initiales + Alert/Card/FormField, Web UI 1 + Dialog/Select/Toast, UI Kit 4 + Badge/Divider/Skeleton, UI Kit 5 + LoadingState/EmptyState/ErrorState/SuccessState, UI Kit 6). React
> (peerDependency `>=18`) + `import '@enistere/ui-kit/styles.css'`. Toutes : `className`, attributs HTML
> natifs, accessibles, pilotées par les tokens, **sans logique métier ni connaissance HTTP/Auth**.

## Button

- **Rôle** : action. Élément `<button>` natif.
- **Props** : `variant` (`primary` | `secondary` | `outline` | `ghost` | `danger`), `size` (`sm` | `md` | `lg`), `loading`, `loadingText?`, + attributs `button` natifs.
- **Exemple** : `<Button variant="primary" loading loadingText="Envoi…">Envoyer</Button>`
- **Accessibilité** : `type="button"` par défaut ; `loading` ⇒ `disabled` réel + `aria-busy` ; spinner décoratif (jamais annoncé deux fois) ; focus visible.
- **Do** : utiliser `loadingText` pour un nom accessible clair pendant le chargement.
- **Don't** : ne pas styliser via valeurs en dur ; ne pas rendre un `<a>` (un Link viendra avec Next.js).
- **Limites** : `danger` sans teinte hover/pressed dédiée en V2 ; pas de `asChild`.

## Input

- **Rôle** : saisie texte. Élément `<input>` natif.
- **Props** : `size` (`sm`|`md`|`lg`), `invalid`, + attributs `input` natifs (`type`, `name`, `value`, `placeholder`, `disabled`, `required`, `aria-*`…). `size` natif (number) est remplacé par le token.
- **Exemple** : `<Input type="email" invalid aria-describedby="err" />`
- **Accessibilité** : `invalid` ⇒ `aria-invalid` ; focus visible ; placeholder lisible.
- **Do** : associer un `Label` (`htmlFor`) ; gérer le message d'erreur à l'extérieur.
- **Don't** : pas de validation/format/masque interne.
- **Limites** : pas de composition label/erreur intégrée (futur `Field`).

## Label

- **Rôle** : étiquette de champ. Élément `<label>` natif.
- **Props** : `required?`, + attributs `label` natifs (`htmlFor`…).
- **Exemple** : `<Label htmlFor="email" required>Email</Label>`
- **Accessibilité** : `htmlFor` lie au champ ; l'astérisque requis est **décoratif** (`aria-hidden`) — la source de vérité est l'attribut `required` du champ.
- **Do** : toujours fournir `htmlFor`.
- **Don't** : ne pas s'appuyer sur l'astérisque pour annoncer le caractère requis.

## Text

- **Rôle** : typographie sémantique.
- **Props** : `variant` (display/heading/title/body/label/caption/code), `tone` (default/muted/inverse/success/warning/danger/info), `as` (`p`|`span`|`div`|`h1`|`h2`|`h3`|`label`|`code`).
- **Exemple** : `<Text as="h1" variant="display">Titre</Text>`
- **Accessibilité** : le **consommateur** choisit l'élément (`as`) — le composant n'impose pas de hiérarchie de titres.
- **Do** : choisir `as` cohérent avec la structure du document.
- **Don't** : ne pas confondre `variant` (style) et niveau de titre (sémantique).

## Spinner

- **Rôle** : progression indéterminée.
- **Props** : `size` (`sm`|`md`|`lg`), `label?`, `decorative?`.
- **Exemples** : autonome `<Spinner label="Chargement…" />` ; dans un Button `<Spinner decorative />`.
- **Accessibilité** : autonome ⇒ `role="status"` + libellé (VisuallyHidden) ; décoratif ⇒ `aria-hidden` ; respecte `prefers-reduced-motion`.
- **Do** : `decorative` quand le texte de chargement est déjà fourni ailleurs.
- **Don't** : ne pas annoncer le chargement deux fois.

## VisuallyHidden

- **Rôle** : contenu masqué visuellement mais lisible par les lecteurs d'écran.
- **Props** : attributs `span` natifs.
- **Exemple** : `<VisuallyHidden>Ouvrir le menu</VisuallyHidden>`
- **Accessibilité** : technique sr-only (jamais `display:none`/`visibility:hidden`).
- **Do** : libeller une icône/un spinner.
- **Don't** : ne pas y mettre du contenu interactif essentiel masqué sans raison.

## Alert

- **Rôle** : message d'information générique (primitive visuelle, sans connaissance HTTP/Auth).
- **Props** : `variant` (`info`|`success`|`warning`|`danger`), `title?` (ReactNode), `role?` (`status`|`alert`), attributs `div` natifs, `forwardRef`.
- **Exemple** : `<Alert variant="warning" title="Attention">Vérifiez la saisie.</Alert>`
- **Accessibilité** : rôle par défaut `status` (poli) pour info/success/warning, `alert` (assertif) pour danger ; surchargeable. La variante est conveyée par **glyphe (forme) + bordure + titre**, jamais par la couleur seule ; le glyphe est `aria-hidden`.
- **Do** : un titre court + un message ; `role="alert"` seulement si urgent.
- **Don't** : ne pas rendre tous les messages `alert` (verbosité lecteurs d'écran) ; ne pas y mettre de sémantique HTTP/Auth (→ états Web Core).

## Card

- **Rôle** : conteneur visuel générique (aucune logique dashboard/métier, aucun rôle imposé).
- **Props** : `Card`/`CardHeader`/`CardContent`/`CardFooter` (attributs `div`, `forwardRef`), `CardTitle` (`as?` `h2..h6`|`p`, **défaut `p`** → aucun titre imposé), `CardDescription` (`p`).
- **Exemple** : `<Card><CardHeader><CardTitle as="h2">Titre</CardTitle><CardDescription>…</CardDescription></CardHeader><CardContent>…</CardContent></Card>`
- **Accessibilité** : une Card visuelle n'a pas de `role` ; le **consommateur choisit le niveau de titre** (`as`). Pour une carte interactive : placer un `Button`/lien natif dans le contenu (hors périmètre).
- **Do** : composer par slots ; choisir un `as` cohérent avec la hiérarchie.
- **Don't** : ne pas imposer un `h2` automatique ; ne pas transformer la Card en composant cliquable.

## FormField

- **Rôle** : association **explicite** label / champ / aide / erreur (pas un moteur de formulaire, pas d'injection magique dans les enfants).
- **Props** : `FormField` (`div`, `forwardRef`), `FormFieldLabel` (réutilise `Label`, `required?`, `htmlFor`), `FormFieldDescription`/`FormFieldError` (`p`, le consommateur leur donne un `id`).
- **Exemple** : voir la docstring — le consommateur câble `htmlFor`/`id`/`aria-describedby`/`aria-invalid`.
- **Accessibilité** : composition lisible ; le label est associé via `htmlFor`/`id` ; aide & erreur référencées par `aria-describedby` ; `aria-invalid` sur le champ.
- **Do** : composition explicite (cf. exemple) ; un `id` unique par aide/erreur.
- **Don't** : ne pas cloner/écraser les enfants ; ne pas dupliquer une politique de mot de passe (validation API = autorité).

## Badge

- **Rôle** : étiquette sémantique courte (statut, catégorie, compteur). Élément `<span>` inline-flex.
- **Props** : `variant` (`neutral`|`info`|`success`|`warning`|`danger`, défaut `neutral`), `size` (`sm`|`md`, défaut `md`), `children` (ReactNode), + attributs `span` natifs, `forwardRef`.
- **Exemple** : `<Badge variant="success">Actif</Badge>`
- **Accessibilité** : texte lisible par défaut ; le consommateur ajoute un `aria-label` si le contenu seul n'est pas suffisamment explicite hors contexte. `user-select:none` pour éviter les sélections parasites.
- **Do** : texte court (1–3 mots) ; utiliser la variante cohérente avec la sémantique (succès → success, erreur → danger).
- **Don't** : ne pas y mettre d'icône (hors périmètre V2) ; ne pas styliser via valeurs en dur.

## Divider

- **Rôle** : séparation visuelle horizontale ou verticale. Élément `<div>`.
- **Props** : `orientation` (`horizontal`|`vertical`, défaut `horizontal`), `label?` (ReactNode — si fourni, le Divider devient un séparateur sémantique avec texte centré), + attributs `div` natifs (sauf `children`), `forwardRef`.
- **Exemple décoratif** : `<Divider />` (pas de `role`, `aria-hidden="true"`)
- **Exemple sémantique** : `<Divider label="OU" />` (`role="separator"`, `aria-orientation="horizontal"`, libellé centré entre deux lignes)
- **Accessibilité** : sans `label` → `aria-hidden="true"` (décoration pure). Avec `label` → `role="separator"` + `aria-orientation`. Les lignes flanquant le label sont `aria-hidden`.
- **Do** : utiliser `label` pour les séparateurs porteurs de sens (ex. « OU » dans un formulaire).
- **Don't** : ne pas utiliser comme espaceur (préférer `margin`/`gap`).

## Skeleton

- **Rôle** : espace réservé de chargement (placeholder animé). Élément `<div>`.
- **Props** : `variant` (`text`|`block`|`circle`, défaut `text`), + attributs `div` natifs, `forwardRef`. Dimensions ajustables via `style` (ex. `style={{ width: '120px', height: '120px' }}` pour un avatar circle).
- **Exemple** : `<Skeleton variant="circle" style={{ width: '48px', height: '48px' }} />`
- **Accessibilité** : toujours `aria-hidden="true"` — l'état de chargement est annoncé par un `role="status"` parent ou un `Spinner` séparé.
- **Animation** : `@keyframes enistere-skeleton-pulse` (opacité 100→40→100 %) activée uniquement si `prefers-reduced-motion: no-preference` (animation désactivée pour les utilisateurs ayant coché « réduire les animations »).
- **Do** : combiner avec un `Spinner` ou un `role="status"` parent pour annoncer l'état de chargement aux lecteurs d'écran.
- **Don't** : ne pas utiliser `aria-label` sur le Skeleton (il est toujours `aria-hidden`) ; ne pas lui fournir de contenu textuel.

## LoadingState

- **Rôle** : état de chargement centré avec indicateur visuel. Élément `<div role="status">`.
- **Props** : `message?` (ReactNode — texte affiché sous le spinner), `size?` (`sm`|`md`|`lg`, défaut `md`), + attributs `div` natifs, `forwardRef`. `role` surchargeable.
- **Exemple** : `<LoadingState message="Chargement des données…" />`
- **Accessibilité** : `role="status"` (live region polie) ; le Spinner interne est décoratif (`aria-hidden`) pour éviter une double annonce. Combiner avec des écrans de chargement ou des suspenses.
- **Do** : fournir un `message` significatif quand le contexte l'exige ; utiliser `decorative` Spinner séparé si le message est fourni dans le DOM.
- **Don't** : ne pas afficher de détails techniques dans `message` ; ne pas surcharger `role="alert"` sauf si l'état de chargement devient urgent.

## EmptyState

- **Rôle** : état vide informatif. Élément `<div>` (pas de rôle ARIA imposé — contenu informatif non urgent).
- **Props** : `title` (ReactNode, **obligatoire**), `description?` (ReactNode), `action?` (ReactNode — slot pour un bouton/lien), + attributs `div` natifs (sauf `title`), `forwardRef`.
- **Exemple** : `<EmptyState title="Aucun résultat" description="Essayez un autre filtre." action={<Button>Créer</Button>} />`
- **Accessibilité** : pas de rôle live implicite (l'état vide n'interrompt pas l'expérience) ; le `title` est obligatoire pour rester descriptif. `action` est un slot libre — le consommateur y place un `Button` ou un lien natif.
- **Do** : un titre court et clair ; une description optionnelle orientée utilisateur.
- **Don't** : ne pas omettre le `title` ; ne pas y intégrer de logique de rechargement (déléguer via `action`).

## ErrorState

- **Rôle** : état d'erreur générique. Élément `<div role="alert">` (assertif par défaut).
- **Props** : `title` (ReactNode, **obligatoire**), `message?` (ReactNode), `action?` (ReactNode — slot retry), `role?` (`alert`|`status`, défaut `alert`), + attributs `div` natifs (sauf `title`), `forwardRef`.
- **Exemple** : `<ErrorState title="Une erreur est survenue" message="Veuillez réessayer." action={<Button>Réessayer</Button>} />`
- **Accessibilité** : `role="alert"` annonce l'erreur immédiatement aux lecteurs d'écran ; l'icône ✕ est décorative (CSS `::before`). Surcharger en `status` si l'erreur est passive (ex. après navigation).
- **Do** : messages d'erreur génériques et orientés utilisateur ; slot `action` pour les actions de récupération.
- **Don't** : ne jamais afficher de détails internes (stack traces, codes SQL, tokens) dans `message`.

## SuccessState

- **Rôle** : confirmation de succès. Élément `<div role="status">` (poli, non intrusif).
- **Props** : `title` (ReactNode, **obligatoire**), `message?` (ReactNode), `action?` (ReactNode — slot de continuation), `role?` (`status`|`alert`, défaut `status`), + attributs `div` natifs (sauf `title`), `forwardRef`.
- **Exemple** : `<SuccessState title="Enregistré" message="Vos modifications ont été sauvegardées." action={<Button>Continuer</Button>} />`
- **Accessibilité** : `role="status"` (live region polie) — annonce le succès sans interrompre l'utilisateur ; l'icône ✓ est décorative (CSS `::before`).
- **Do** : un message court et positif ; utiliser `action` pour proposer une suite logique.
- **Don't** : ne pas surcharger en `alert` sauf si le succès nécessite une attention immédiate.
