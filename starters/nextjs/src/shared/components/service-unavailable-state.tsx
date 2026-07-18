import type { ReactElement } from "react";
import { Alert, Button, Text } from "@enistere/ui-kit";

export interface ServiceUnavailableStateProps {
  readonly title?: string;
  readonly description?: string;
  /** Référence technique (non sensible), affichée séparément. */
  readonly requestId?: string;
  /** Réessai par **lien** (rechargement → nouvelle résolution serveur ; sûr en Server Component). */
  readonly retryHref?: string;
  /** Réessai par **action client** (bouton). N'utiliser qu'en Client Component. */
  readonly onRetry?: () => void;
  readonly inline?: boolean;
}

/**
 * État **service indisponible** (panne temporaire) : distinct d'une session **anonyme** (l'utilisateur
 * n'est pas réputé déconnecté). `role="alert"` (condition notable). Message générique + `requestId`.
 */
export function ServiceUnavailableState({
  title = "Service indisponible",
  description = "Le service est momentanément indisponible. Réessayez dans un instant.",
  requestId,
  retryHref,
  onRetry,
  inline = false,
}: ServiceUnavailableStateProps): ReactElement {
  return (
    <div className={inline ? "state state--unavailable state--inline" : "state state--unavailable"}>
      <Alert variant="warning" role="alert" title={title}>
        <Text as="p" variant="body">
          {description}
        </Text>
        {requestId !== undefined ? (
          <Text as="p" variant="caption" tone="muted">
            Référence : {requestId}
          </Text>
        ) : null}
        {onRetry !== undefined ? (
          <div className="state__actions">
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Réessayer
            </Button>
          </div>
        ) : null}
        {retryHref !== undefined ? (
          <a className="state__link" href={retryHref}>
            Réessayer
          </a>
        ) : null}
      </Alert>
    </div>
  );
}
