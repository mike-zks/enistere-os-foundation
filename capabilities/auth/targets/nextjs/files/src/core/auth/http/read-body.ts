/** Lecture **bornée** d'un corps JSON (anti-DoS : taille limitée, Content-Type vérifié). */

export const MAX_AUTH_BODY_BYTES = 4096; // login : payload minuscule

export type BodyErrorCode = "too_large" | "invalid_content_type" | "invalid_json";

export class BodyError extends Error {
  constructor(
    readonly code: BodyErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "BodyError";
  }
}

/**
 * Lit un corps JSON borné. Vérifie le `Content-Type`, rejette via `Content-Length` déclaré ET la taille
 * réelle (octets), puis `JSON.parse`. Lève `BodyError` (générique, sans contenu sensible).
 */
export async function readBoundedJsonBody(
  request: Request,
  maxBytes: number = MAX_AUTH_BODY_BYTES,
): Promise<unknown> {
  const contentType = (request.headers.get("content-type") ?? "").toLowerCase();
  if (!contentType.includes("application/json")) {
    throw new BodyError("invalid_content_type", "Content-Type attendu : application/json.");
  }
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    const declaredBytes = Number(declared);
    if (Number.isFinite(declaredBytes) && declaredBytes > maxBytes) {
      throw new BodyError("too_large", "Corps trop volumineux.");
    }
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) {
    throw new BodyError("too_large", "Corps trop volumineux.");
  }
  if (text.trim() === "") {
    throw new BodyError("invalid_json", "Corps JSON vide.");
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new BodyError("invalid_json", "JSON invalide.");
  }
}
