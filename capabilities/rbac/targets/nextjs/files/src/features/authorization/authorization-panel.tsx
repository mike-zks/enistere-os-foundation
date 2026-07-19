"use client";

import type { ReactElement } from "react";

import { useSession } from "../auth/use-session.js";
import { AuthorizationStatusView } from "./authorization-status-view.js";
import { useAuthorization } from "./use-authorization.js";

/**
 * Panneau d'autorisation (Client Component) apporté par la capability RBAC :
 * consomme `useAuthorization` et n'affiche qu'un **compte** de rôles/permissions.
 *
 * Affichage conditionnel UX uniquement — aucune décision de sécurité n'est prise
 * ici : l'API reste l'autorité et refuse elle-même (401/403) toute requête non
 * autorisée. Aucun rôle n'est codé en dur.
 */
export function AuthorizationPanel(): ReactElement {
  const session = useSession();
  const authorization = useAuthorization();

  return (
    <AuthorizationStatusView
      visible={session.isAuthenticated}
      roleCount={authorization.roles.length}
      permissionCount={authorization.permissions.length}
    />
  );
}
