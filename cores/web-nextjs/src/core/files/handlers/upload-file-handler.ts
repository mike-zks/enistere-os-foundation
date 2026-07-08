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

const DEFAULT_FILE_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;
const SUBJECT_ID_MAX_LENGTH = 255;

function isValidCategory(v: unknown): v is FileCategory {
  return FILE_CATEGORIES.includes(v as FileCategory);
}

function readMaxUploadBodyBytes(): number {
  const raw = process.env.FILE_MAX_SIZE_BYTES;
  const parsed = raw === undefined ? DEFAULT_FILE_MAX_SIZE_BYTES : Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return DEFAULT_FILE_MAX_SIZE_BYTES + MULTIPART_OVERHEAD_BYTES;
  }
  return parsed + MULTIPART_OVERHEAD_BYTES;
}

function isContentLengthTooLarge(request: Request): boolean {
  const raw = request.headers.get("content-length");
  if (raw === null) return false;
  const length = Number.parseInt(raw, 10);
  return Number.isSafeInteger(length) && length > readMaxUploadBodyBytes();
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

  if (isContentLengthTooLarge(request)) {
    return jsonError(413, "FILE_TOO_LARGE", "Fichier trop volumineux.", { requestId });
  }

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
    const normalizedSubjectId = typeof subjectIdRaw === "string" ? subjectIdRaw.trim() : "";
    if (normalizedSubjectId.length > SUBJECT_ID_MAX_LENGTH) {
      return jsonError(400, "INVALID_SUBJECT_ID", "Référence invalide.", { requestId });
    }
    subjectId = normalizedSubjectId.length > 0 ? normalizedSubjectId : undefined;
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
