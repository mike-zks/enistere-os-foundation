"use client";

import type { ReactElement } from "react";
import { useEffect } from "react";

import { ErrorState } from "../../shared/components/error-state.js";

/**
 * Frontière d'erreur **locale au groupe protégé** (Client Component — reçoit `reset`). Filet de sécurité
 * pour une erreur **inattendue** du rendu : l'indisponibilité Auth attendue est, elle, gérée par le layout
 * (rendu contrôlé). Message **générique**, aucune donnée privée ni détail technique exposé.
 */
export default function ProtectedError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}): ReactElement {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="foundation">
      <ErrorState
        title="Espace protégé indisponible"
        description="Une erreur inattendue est survenue. Réessayez."
        onReset={reset}
      />
    </main>
  );
}
