import type { ReactElement, ReactNode } from "react";
import { Text } from "@enistere/ui-kit";

export interface PageHeaderProps {
  readonly title: string;
  /** Surtitre court optionnel (catégorie/section). */
  readonly eyebrow?: string;
  readonly description?: string;
  /** Actions de page (boutons/liens). Passent sous le contenu sur petit écran. */
  readonly actions?: ReactNode;
  /** Niveau du titre principal. **Défaut `h1`** ; configurable pour préserver la hiérarchie. */
  readonly as?: "h1" | "h2";
}

/**
 * En-tête de page (composition Web). Titre principal `h1` par défaut (configurable). Sans breadcrumbs,
 * tabs ni navigation métier. Actions responsives (passent dessous sur petit écran via les tokens).
 */
export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  as = "h1",
}: PageHeaderProps): ReactElement {
  return (
    <header className="page-header">
      <div className="page-header__text">
        {eyebrow !== undefined ? (
          <Text as="span" variant="label" tone="muted" className="page-header__eyebrow">
            {eyebrow}
          </Text>
        ) : null}
        <Text as={as} variant="display">
          {title}
        </Text>
        {description !== undefined ? (
          <Text as="p" variant="body" tone="muted">
            {description}
          </Text>
        ) : null}
      </div>
      {actions !== undefined ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}
