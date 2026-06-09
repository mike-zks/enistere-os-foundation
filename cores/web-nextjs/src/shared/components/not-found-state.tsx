import type { ReactElement } from "react";
import { Text } from "@enistere/ui-kit";

export interface NotFoundStateProps {
  readonly homeHref?: string;
}

/**
 * État 404 générique (sûr en Server Component). Lien de retour en ancre native (`<a>`) :
 * navigation pleine page, sans dépendance au routeur — donc testable hors runtime Next.
 */
export function NotFoundState({ homeHref = "/" }: NotFoundStateProps): ReactElement {
  return (
    <div className="state state--not-found" role="alert">
      <Text as="h1" variant="display">
        404
      </Text>
      <Text as="p" variant="body" tone="muted">
        Cette page n&apos;existe pas.
      </Text>
      <a className="state__link" href={homeHref}>
        Retour à l&apos;accueil
      </a>
    </div>
  );
}
