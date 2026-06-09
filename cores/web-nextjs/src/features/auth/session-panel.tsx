"use client";

import { Button, Text } from "@enistere/ui-kit";
import type { ReactElement } from "react";

import { AuthorizationStatusView } from "./authorization-status-view.js";
import { SessionStatusView } from "./session-status-view.js";
import { useAuthorization } from "./use-authorization.js";
import { useLogout } from "./use-logout.js";
import { useSession } from "./use-session.js";

/**
 * Panneau technique de session (Client Component) : consomme `useSession`/`useAuthorization`/`useLogout`.
 * Le bouton de déconnexion prouve l'appel BFF + CSRF + **purge du cache** + retour à l'état anonyme — ce
 * n'est pas encore une navigation utilisateur complète.
 */
export function SessionPanel(): ReactElement {
  const session = useSession();
  const authorization = useAuthorization();
  const logout = useLogout();

  return (
    <div className="session-panel">
      <SessionStatusView
        state={session.status}
        email={session.user?.email}
        userStatus={session.user?.status}
        errorMessage={session.error?.message}
        onRetry={session.refetch}
      />
      <AuthorizationStatusView
        visible={session.isAuthenticated}
        roleCount={authorization.roles.length}
        permissionCount={authorization.permissions.length}
      />
      {session.isAuthenticated ? (
        <div className="session-panel__actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void logout.logout()}
            disabled={logout.isPending}
          >
            Se déconnecter
          </Button>
          {logout.error !== undefined ? (
            <Text as="p" variant="caption" tone="danger">
              {logout.error}
            </Text>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
