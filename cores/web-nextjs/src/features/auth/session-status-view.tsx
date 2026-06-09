import { Button, Spinner, Text } from "@enistere/ui-kit";
import type { ReactElement } from "react";

export type SessionViewState = "loading" | "anonymous" | "authenticated" | "error";

export interface SessionStatusViewProps {
  readonly state: SessionViewState;
  /** Authentifié : e-mail affiché. */
  readonly email?: string;
  /** Authentifié : statut du compte (ACTIVE/…). */
  readonly userStatus?: string;
  /** Erreur : message **public** générique. */
  readonly errorMessage?: string;
  readonly onRetry?: () => void;
}

/**
 * Affichage **présentationnel** de l'état de session (sans hook → testable hors provider). N'expose
 * jamais de token ; en mode authentifié, affiche au plus l'e-mail et le statut du compte.
 */
export function SessionStatusView({
  state,
  email,
  userStatus,
  errorMessage,
  onRetry,
}: SessionStatusViewProps): ReactElement {
  return (
    <section className="session" aria-label="État de session" data-state={state}>
      <Text as="h2" variant="title">
        Session
      </Text>

      {state === "loading" ? <Spinner size="sm" label="Vérification de la session" /> : null}

      {state === "anonymous" ? (
        <Text as="p" variant="body" tone="muted">
          Session anonyme
        </Text>
      ) : null}

      {state === "authenticated" ? (
        <div className="session__user">
          <Text as="p" variant="body" tone="success">
            Session authentifiée
          </Text>
          {email !== undefined ? (
            <Text as="span" variant="body">
              {email}
            </Text>
          ) : null}
          {userStatus !== undefined ? (
            <Text as="span" variant="caption" tone="muted">
              {userStatus}
            </Text>
          ) : null}
        </div>
      ) : null}

      {state === "error" ? (
        <div className="session__error" role="alert">
          <Text as="p" variant="body" tone="danger">
            {errorMessage ?? "Erreur de session."}
          </Text>
          {onRetry ? (
            <Button variant="ghost" size="sm" onClick={onRetry}>
              Réessayer
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
