import type { ReactElement, ReactNode } from "react";
import { Alert, Text } from "@enistere/ui-kit";

export interface UnauthorizedStateProps {
  readonly title?: string;
  readonly description?: string;
  /** Cible de connexion (lien natif, navigation pleine page — pas de logique Auth complexe ici). */
  readonly loginHref?: string;
  /** Action personnalisée (remplace le lien de connexion par défaut). */
  readonly action?: ReactNode;
  readonly inline?: boolean;
}

/**
 * État **non authentifié** (401). Sémantiquement **distinct** de `ForbiddenState` (403). Propose au plus
 * un lien vers la connexion (ancre native) — ne gère pas la navigation Auth (returnTo, etc.).
 */
export function UnauthorizedState({
  title = "Connexion requise",
  description = "Connectez-vous pour accéder à cette page.",
  loginHref = "/login",
  action,
  inline = false,
}: UnauthorizedStateProps): ReactElement {
  return (
    <div className={inline ? "state state--unauthorized state--inline" : "state state--unauthorized"}>
      <Alert variant="info" title={title}>
        <Text as="p" variant="body">
          {description}
        </Text>
        {action ?? (
          <a className="state__link" href={loginHref}>
            Se connecter
          </a>
        )}
      </Alert>
    </div>
  );
}
