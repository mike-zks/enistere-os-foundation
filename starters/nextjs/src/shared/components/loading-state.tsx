import { LoadingState as UiKitLoadingState } from "@enistere/ui-kit";
import type { ReactElement } from "react";

export interface LoadingStateProps {
  /** Libellé annoncé aux technologies d'assistance et affiché. */
  readonly label?: string;
  /** Compact (intégré dans une page) au lieu de pleine hauteur. */
  readonly inline?: boolean;
}

/**
 * État de chargement générique — délègue à `LoadingState` du UI Kit 6.
 * Le conteneur porte `role="status"` ; le spinner interne est décoratif.
 */
export function LoadingState({ label = "Chargement…", inline = false }: LoadingStateProps): ReactElement {
  return (
    <UiKitLoadingState
      message={label}
      className={inline ? "state state--loading state--inline" : "state state--loading"}
    />
  );
}
