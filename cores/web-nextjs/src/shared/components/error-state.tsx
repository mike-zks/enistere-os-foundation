import { Button, ErrorState as UiKitErrorState } from "@enistere/ui-kit";
import type { ReactElement } from "react";

export interface ErrorStateProps {
  readonly title?: string;
  /** Message **public générique** (jamais de cause/stack/réponse brute/token). */
  readonly description?: string;
  /** Référence technique de corrélation (non sensible) — affichée avec le message. */
  readonly requestId?: string;
  /** Action de récupération (fournie par `app/error.tsx`). Si absente, aucun bouton. */
  readonly onReset?: () => void;
  /** Compact (intégré dans une page) au lieu de pleine hauteur. */
  readonly inline?: boolean;
}

/**
 * État d'erreur générique — délègue à `ErrorState` du UI Kit 6.
 * `role="alert"` assertif. N'affiche **jamais** de donnée sensible automatiquement :
 * seuls `title`/`description` génériques et un `requestId` optionnel de référence.
 */
export function ErrorState({
  title = "Une erreur est survenue",
  description = "Le socle a rencontré un problème inattendu.",
  requestId,
  onReset,
  inline = false,
}: ErrorStateProps): ReactElement {
  const message = requestId !== undefined ? `${description} · Référence : ${requestId}` : description;

  return (
    <UiKitErrorState
      title={title}
      message={message}
      action={
        onReset !== undefined ? (
          <Button variant="primary" size="sm" onClick={onReset}>
            Réessayer
          </Button>
        ) : undefined
      }
      className={inline ? "state state--error state--inline" : "state state--error"}
    />
  );
}
