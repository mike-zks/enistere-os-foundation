/**
 * Déclarations ambiantes du Web Core.
 *
 * Import CSS à effet de bord : seul `app/layout.tsx` importe des feuilles de style
 * (`@enistere/ui-kit/styles.css` + `./globals.css`). Cette déclaration garantit que `tsc`
 * accepte ces imports sans binding (la résolution réelle est faite par le bundler Next).
 */
declare module "*.css";
