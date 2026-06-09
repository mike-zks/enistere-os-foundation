import type { ReactElement } from "react";
import { Spinner, Text } from "@enistere/ui-kit";

export interface LoadingStateProps {
  /** Libellé annoncé aux technologies d'assistance et affiché. */
  readonly label?: string;
}

/**
 * État de chargement générique (sûr en Server Component). Le conteneur porte `role="status"` ;
 * le spinner est décoratif (pas d'annonce en double).
 */
export function LoadingState({ label = "Chargement…" }: LoadingStateProps): ReactElement {
  return (
    <div className="state state--loading" role="status">
      <Spinner size="lg" decorative />
      <Text as="p" variant="body" tone="muted">
        {label}
      </Text>
    </div>
  );
}
