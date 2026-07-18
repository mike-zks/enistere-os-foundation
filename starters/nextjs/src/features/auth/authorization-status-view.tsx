import { Text } from "@enistere/ui-kit";
import type { ReactElement } from "react";

export interface AuthorizationStatusViewProps {
  /** N'afficher que si la session est authentifiée. */
  readonly visible: boolean;
  readonly roleCount: number;
  readonly permissionCount: number;
}

/**
 * Affichage **technique** des autorisations (compte de rôles/permissions) — pas une interface
 * d'administration RBAC. Présentationnel (sans hook).
 */
export function AuthorizationStatusView({
  visible,
  roleCount,
  permissionCount,
}: AuthorizationStatusViewProps): ReactElement | null {
  if (!visible) {
    return null;
  }
  return (
    <section className="authorization" aria-label="Autorisations">
      <Text as="h2" variant="title">
        Autorisations
      </Text>
      <Text as="p" variant="body">
        {roleCount} rôle(s) · {permissionCount} permission(s)
      </Text>
    </section>
  );
}
