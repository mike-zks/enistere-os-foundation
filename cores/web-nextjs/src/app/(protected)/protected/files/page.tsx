import type { ReactElement } from "react";

import { FileListView } from "../../../../features/files/file-list-view.js";

// Route protégée `/protected/files` — héritée du layout protégé (session résolue côté serveur).
// Dynamique (pagination dépend des searchParams). Le build ne déclenche aucun appel API.
export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

/**
 * Page **liste des fichiers** (lecture). Mince : valide la session via le layout, passe les paramètres
 * de pagination au composant client `FileListView` (TanStack Query). Pas de double appel serveur+client.
 */
export default async function ProtectedFilesPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ limit?: string; offset?: string }>;
}): Promise<ReactElement> {
  const params = await searchParams;
  const limit = params.limit !== undefined ? Number(params.limit) : DEFAULT_LIMIT;
  const offset = params.offset !== undefined ? Number(params.offset) : DEFAULT_OFFSET;

  return (
    <main className="foundation" aria-label="Mes fichiers">
      <FileListView
        limit={Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT}
        offset={Number.isFinite(offset) && offset >= 0 ? offset : DEFAULT_OFFSET}
      />
    </main>
  );
}
