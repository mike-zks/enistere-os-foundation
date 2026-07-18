import { EmptyState as UiKitEmptyState } from "@enistere/ui-kit";
import type { ReactElement, ReactNode } from "react";

export interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
  /** Action optionnelle (ex. un `Button`/lien fourni par le consommateur). */
  readonly action?: ReactNode;
  /** Compact (intégré dans une page) au lieu de pleine hauteur. */
  readonly inline?: boolean;
}

/**
 * État **vide** générique — délègue à `EmptyState` du UI Kit 6.
 * Informationnel : pas de `role` live (ce n'est ni une alerte ni un statut).
 */
export function EmptyState({ title, description, action, inline = false }: EmptyStateProps): ReactElement {
  return (
    <UiKitEmptyState
      title={title}
      description={description}
      action={action}
      className={inline ? "state state--empty state--inline" : "state state--empty"}
    />
  );
}
