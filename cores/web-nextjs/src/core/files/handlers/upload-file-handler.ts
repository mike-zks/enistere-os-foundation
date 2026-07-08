import type { FileCategory } from "@enistere/api-client-fetch";

import { createAuthenticatedServerApiClient } from "../../api/server/create-authenticated-server-api-client.js";
import { assertPost, checkOriginAndCsrf, resolveRequestId } from "../../auth/handlers/security.js";
import type { AuthHandlerDeps } from "../../auth/handlers/types.js";
import { jsonError, jsonOk } from "../../auth/http/web-response.js";
import { filesErrorResponse } from "../http/files-response.js";

const FILE_CATEGORIES = [
  "IMAGE",
  "DOCUMENT",
  "AVATAR",
  "MEDIA",
  "VIDEO",
  "AUDIO",
  "IDENTITY_DOCUMENT",
  "ATTACHMENT",
  "OTHER",
] as const satisfies readonly FileCategory[];

function isValidCategory(v: unknown): v is FileCategory {
  return FILE_CATEGORIES.includes(v as FileCategory);
}

/**
 * `POST /api/files/upload` — upload multipart sécurisé. Jamais proxy générique.
 *
 * Ordre : méthode (405) → **Origin/Referer + CSRF** (403, **aucun appel API** avant validation) → parse
 * FormData + **validation fichier+catégorie** (400) → API Core via client `writable` (un seul refresh
 * coordonné si access expiré). Réponse **minimale** : contrat `PublicStoredFileDto` uniquement, `no-store`.
 * Aucun log de nom/chemin/contenu. L'API Core reste l'autorité MIME/taille/permissions (ADR-007).
 */
export async function handleUploadFile(request: Request, deps: AuthHandlerDeps): Promise<Response> {
  const requestId = resolveRequestId(request);

  const methodError = assertPost(request, requestId);
  if (methodError) return methodError;

  const securityError = checkOriginAndCsrf(request, deps, requestId);
  if (securityError) return securityError;

  let file: Blob;
  let category: FileCategory;
  let subjectId: string | undefined;

  try {
    const form = await request.formData();
    const fileEntry = form.get("file");
    const categoryRaw = form.get("category");
    const subjectIdRaw = form.get("subjectId");

    if (!(fileEntry instanceof Blob) || fileEntry.size === 0) {
      return jsonError(400, "FILE_REQUIRED", "Fichier requis.", { requestId });
    }
    if (!isValidCategory(categoryRaw)) {
      return jsonError(400, "INVALID_CATEGORY", "Catégorie invalide.", { requestId });
    }

    file = fileEntry;
    category = categoryRaw;
    subjectId =
      typeof subjectIdRaw === "string" && subjectIdRaw.length > 0 ? subjectIdRaw : undefined;
  } catch {
    return jsonError(400, "INVALID_FORM", "Corps de la requête invalide.", { requestId });
  }

  const client = createAuthenticatedServerApiClient({
    cookieStore: deps.cookieStore,
    mode: "writable",
    env: deps.env,
    fetch: deps.fetch,
    baseUrl: deps.baseUrl,
    requestId,
  });

  try {
    const uploaded = await client.files.upload(file, category, { subjectId });
    return jsonOk(uploaded, { requestId });
  } catch (error) {
    return filesErrorResponse(error, requestId);
  }
}
