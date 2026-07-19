"use client";

import { Button, Text } from "@enistere/ui-kit";
import type { ReactElement } from "react";

import { SessionStatusView } from "./session-status-view.js";
import { useLogout } from "./use-logout.js";
import { useSession } from "./use-session.js";

/**
 * Panneau technique de session (Client Component) : consomme `useSession`/`useLogout`.
 * Le bouton de déconnexion prouve l'appel BFF + CSRF + **purge du cache** + retour à l'état anonyme — ce
 * n'est pas encore une navigation utilisateur complète.
 *
 * Le résumé d'autorisation (rôles/permissions) relève de la capability RBAC composée par-dessus Auth ;
 * il n'est pas affiché ici pour ne pas coupler Auth à RBAC.
 */
export function SessionPanel(): ReactElement {
  const session = useSession();
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
