import { Button, Spinner, Text } from "@enistere/ui-kit";
import type { ReactElement } from "react";

export type HealthProbeState = "not-configured" | "loading" | "success" | "error";

export interface HealthProbeViewProps {
  readonly label: string;
  readonly state: HealthProbeState;
  /** Valeur affichée en cas de succès (ex. `ok`/`live`/`ready`). */
  readonly value?: string;
  /** Message **public** générique en cas d'erreur. */
  readonly errorMessage?: string;
  /** Référence de corrélation technique (jamais une preuve de sécurité). */
  readonly requestId?: string | null;
  /** Requête en cours (désactive « Relancer »). */
  readonly busy?: boolean;
  /** Action de relance ; si absente, aucun bouton (ex. non configuré). */
  readonly onRetry?: () => void;
}

/**
 * Affichage présentationnel d'une sonde Health (sans hook, donc testable hors provider). États :
 * non configuré / chargement / succès / erreur. N'expose jamais de détail technique brut.
 */
export function HealthProbeView({
  label,
  state,
  value,
  errorMessage,
  requestId,
  busy,
  onRetry,
}: HealthProbeViewProps): ReactElement {
  return (
    <div className="health-probe" data-state={state}>
      <Text as="span" variant="label" tone="muted">
        {label}
      </Text>

      <span className="health-probe__value">
        {state === "not-configured" ? (
          <Text as="span" variant="body" tone="muted">
            Non configuré
          </Text>
        ) : null}

        {state === "loading" ? <Spinner size="sm" label={`Vérification : ${label}`} /> : null}

        {state === "success" ? (
          <Text as="span" variant="body" tone="success">
            {value ?? "—"}
          </Text>
        ) : null}

        {state === "error" ? (
          <span className="health-probe__error">
            <Text as="span" variant="body" tone="danger">
              {errorMessage ?? "Erreur"}
            </Text>
            {requestId !== undefined && requestId !== null ? (
              <Text as="span" variant="caption" tone="muted">
                réf. {requestId}
              </Text>
            ) : null}
          </span>
        ) : null}
      </span>

      {onRetry ? (
        <Button variant="ghost" size="sm" onClick={onRetry} disabled={busy === true}>
          Relancer
        </Button>
      ) : null}
    </div>
  );
}
