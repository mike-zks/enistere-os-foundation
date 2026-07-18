import type { ReactElement, ReactNode } from "react";
import { Alert, Text } from "@enistere/ui-kit";

export interface ForbiddenStateProps {
  readonly title?: string;
  readonly description?: string;
  /** Action optionnelle (ex. retour à l'accueil). Aucune navigation imposée. */
  readonly action?: ReactNode;
  readonly inline?: boolean;
}

/**
 * État **accès refusé** (403) : utilisateur **authentifié** mais autorisation insuffisante. Sémantiquement
 * **distinct** de `UnauthorizedState` (401). **Ne révèle pas** la permission manquante (message générique).
 */
export function ForbiddenState({
  title = "Accès refusé",
  description = "Vous n'avez pas l'autorisation d'accéder à cette ressource.",
  action,
  inline = false,
}: ForbiddenStateProps): ReactElement {
  return (
    <div className={inline ? "state state--forbidden state--inline" : "state state--forbidden"}>
      <Alert variant="warning" title={title}>
        <Text as="p" variant="body">
          {description}
        </Text>
        {action !== undefined ? <div className="state__actions">{action}</div> : null}
      </Alert>
    </div>
  );
}
