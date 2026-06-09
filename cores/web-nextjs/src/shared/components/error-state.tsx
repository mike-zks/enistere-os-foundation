import type { ReactElement } from "react";
import { Button, Text } from "@enistere/ui-kit";

export interface ErrorStateProps {
  readonly title?: string;
  readonly description?: string;
  /** Action de récupération (fournie par `app/error.tsx`). Si absente, aucun bouton. */
  readonly onReset?: () => void;
}

/**
 * Affichage d'erreur présentationnel. Utilisé par `app/error.tsx` (Client Component) ; reçoit
 * l'action `reset` de Next. Conteneur `role="alert"`.
 */
export function ErrorState({
  title = "Une erreur est survenue",
  description = "Le socle a rencontré un problème inattendu.",
  onReset,
}: ErrorStateProps): ReactElement {
  return (
    <div className="state state--error" role="alert">
      <Text as="h1" variant="heading" tone="danger">
        {title}
      </Text>
      <Text as="p" variant="body" tone="muted">
        {description}
      </Text>
      {onReset ? (
        <Button variant="primary" onClick={onReset}>
          Réessayer
        </Button>
      ) : null}
    </div>
  );
}
