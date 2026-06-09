"use client";

import type { ReactElement } from "react";
import { useEffect } from "react";
import { ErrorState } from "../shared/components/error-state";

/**
 * Frontière d'erreur de segment (App Router) — DOIT être un Client Component (reçoit `reset`).
 * Web 1 : journalisation console minimale ; l'observabilité (Sentry, etc.) viendra en V2.
 */
export default function Error({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}): ReactElement {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState onReset={reset} />;
}
