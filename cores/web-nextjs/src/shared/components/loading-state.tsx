import type { ReactElement } from "react";
import { Spinner, Text } from "@enistere/ui-kit";

export interface LoadingStateProps {
  /** Libellé annoncé aux technologies d'assistance et affiché. */
  readonly label?: string;
  /** Compact (intégré dans une page) au lieu de pleine hauteur. */
  readonly inline?: boolean;
}

/**
 * État de chargement générique (sûr en Server Component). Le conteneur porte `role="status"` ;
 * le spinner est décoratif (pas d'annonce en double). Pas de skeleton complexe.
 */
export function LoadingState({ label = "Chargement…", inline = false }: LoadingStateProps): ReactElement {
  return (
    <div
      className={inline ? "state state--loading state--inline" : "state state--loading"}
      role="status"
    >
      <Spinner size="lg" decorative />
      <Text as="p" variant="body" tone="muted">
        {label}
      </Text>
    </div>
  );
}
