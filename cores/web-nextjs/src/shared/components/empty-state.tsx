import type { ReactElement, ReactNode } from "react";
import { Text } from "@enistere/ui-kit";

export interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
  /** Action optionnelle (ex. un `Button`/lien fourni par le consommateur). */
  readonly action?: ReactNode;
  /** Compact (intégré dans une page) au lieu de pleine hauteur. */
  readonly inline?: boolean;
}

/**
 * État **vide** générique (aucune erreur). Informationnel : pas de `role` live (ce n'est ni une alerte
 * ni un statut). Aucun texte métier par défaut — `title`/`description` fournis par le consommateur.
 */
export function EmptyState({ title, description, action, inline = false }: EmptyStateProps): ReactElement {
  return (
    <div className={inline ? "state state--empty state--inline" : "state state--empty"}>
      <Text as="p" variant="title">
        {title}
      </Text>
      {description !== undefined ? (
        <Text as="p" variant="body" tone="muted">
          {description}
        </Text>
      ) : null}
      {action !== undefined ? <div className="state__actions">{action}</div> : null}
    </div>
  );
}
