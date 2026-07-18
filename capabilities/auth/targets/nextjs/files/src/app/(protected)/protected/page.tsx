import type { ReactElement } from "react";

import { ProtectedNotice } from "../../../features/auth/protected-notice.js";
import { SessionPanel } from "../../../features/auth/session-panel.js";

// Route protégée technique (`/protected`) — dynamique (la protection dépend de la requête). Le layout du
// groupe `(protected)` a déjà validé la session et hydraté le profil ; cette page ne fait que démontrer
// l'état hydraté (session sans flash) et la déconnexion. Aucun contenu métier.
export const dynamic = "force-dynamic";

/**
 * Page **privée technique**. N'affiche que des informations raisonnables (e-mail, statut) via le panneau
 * de session existant, qui consomme le cache **hydraté** par le layout (`useSession` authentifié dès le
 * premier rendu). Les autorisations sont chargées côté client (API = autorité finale). La déconnexion
 * purge le cache Auth ; un rafraîchissement ultérieur entraînera la redirection serveur.
 */
export default function ProtectedPage(): ReactElement {
  return (
    <main className="foundation" aria-labelledby="protected-title">
      <header className="foundation__header">
        <ProtectedNotice />
      </header>
      <SessionPanel />
    </main>
  );
}
