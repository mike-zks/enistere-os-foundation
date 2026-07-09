import type { ReactElement } from "react";

import { FileDetailsWithNav } from "./file-details-with-nav.js";

// Route privée technique (`/protected/files/[id]`) — héritée du layout protégé (session résolue côté
// serveur). Dynamique (le détail dépend de la requête). Le build ne déclenche aucun appel API.
export const dynamic = "force-dynamic";

/**
 * Page de **détail d'un fichier** (lecture). Mince : valide la session via le layout, passe l'`id` au
 * conteneur client `FileDetails` (métadonnées via TanStack Query). Pas de double appel serveur+client.
 */
export default async function ProtectedFilePage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  const { id } = await params;
  return (
    <main className="foundation" aria-label="Détail du fichier">
      <FileDetailsWithNav fileId={id} />
    </main>
  );
}
