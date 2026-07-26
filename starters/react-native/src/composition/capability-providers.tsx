// Point d'intégration central des capabilities (contrat de composition Factory).
//
// Ce fichier est REMPLACÉ par la Factory lors d'une génération composée : les
// overlays déclarent leurs providers via l'intégration connue `expo.provider`
// et la Factory régénère ce fichier de manière déterministe. Le runtime neutre
// n'enregistre aucun provider : passthrough.
import type { ReactElement, ReactNode } from 'react';

/** Providers apportés par les capabilities composées, imbriqués dans l'ordre. */
export function CapabilityProviders({ children }: { readonly children: ReactNode }): ReactElement {
  return <>{children}</>;
}
