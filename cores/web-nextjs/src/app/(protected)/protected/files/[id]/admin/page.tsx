import type { ReactElement } from "react";

import { AdminFileActions } from "../../../../../../features/files/admin-file-actions.js";

export const dynamic = "force-dynamic";

/**
 * Page **admin** d'un fichier : actions de quarantaine/restauration. Séparée de la page utilisateur
 * (`/protected/files/[id]`). Session résolue par le layout protégé — `AdminFileActions` gère les
 * permissions côté client (`useAuthorization`). Mince : aucune logique ici.
 */
export default async function ProtectedFileAdminPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  const { id } = await params;
  return (
    <main className="foundation" aria-label="Administration du fichier">
      <AdminFileActions fileId={id} />
    </main>
  );
}
