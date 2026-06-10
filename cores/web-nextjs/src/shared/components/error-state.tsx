import type { ReactElement } from "react";
import { Alert, Button, Text } from "@enistere/ui-kit";

export interface ErrorStateProps {
  readonly title?: string;
  /** Message **public générique** (jamais de cause/stack/réponse brute/token). */
  readonly description?: string;
  /** Référence technique de corrélation (non sensible) — affichée séparément du message. */
  readonly requestId?: string;
  /** Action de récupération (fournie par `app/error.tsx`). Si absente, aucun bouton. */
  readonly onReset?: () => void;
  /** Compact (intégré dans une page) au lieu de pleine hauteur. */
  readonly inline?: boolean;
}

/**
 * État d'erreur générique (composition Web). Bâti sur l'`Alert` (variant `danger` → `role="alert"`).
 * N'affiche **jamais** automatiquement de donnée sensible : seuls `title`/`description` génériques et un
 * `requestId` optionnel de référence.
 */
export function ErrorState({
  title = "Une erreur est survenue",
  description = "Le socle a rencontré un problème inattendu.",
  requestId,
  onReset,
  inline = false,
}: ErrorStateProps): ReactElement {
  return (
    <div className={inline ? "state state--error state--inline" : "state state--error"}>
      <Alert variant="danger" title={title}>
        <Text as="p" variant="body">
          {description}
        </Text>
        {requestId !== undefined ? (
          <Text as="p" variant="caption" tone="muted">
            Référence : {requestId}
          </Text>
        ) : null}
        {onReset ? (
          <div className="state__actions">
            <Button variant="primary" size="sm" onClick={onReset}>
              Réessayer
            </Button>
          </div>
        ) : null}
      </Alert>
    </div>
  );
}
