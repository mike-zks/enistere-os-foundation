import type { ReactElement } from "react";

import { UploadForm } from "../../../../../features/files/upload-form.js";

export const dynamic = "force-dynamic";

/** Page d'upload de fichier (route protégée — session validée par le layout parent). */
export default function UploadFilePage(): ReactElement {
  return (
    <main className="foundation" aria-label="Envoi de fichier">
      <UploadForm />
    </main>
  );
}
