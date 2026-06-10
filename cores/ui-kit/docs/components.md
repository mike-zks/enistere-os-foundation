# Primitives Web du UI Kit (V2)

> Documentation légère des **9 primitives** (6 initiales + Alert/Card/FormField, Web UI 1). React
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
