/**
 * Origines autorisées pour les requêtes mutatives Auth (anti-CSRF, complément du double-submit).
 *
 * Configuration explicite via `WEB_ALLOWED_ORIGINS` (liste séparée par des virgules). Aucune wildcard,
 * URLs absolues http/https, sans credentials. Comparaison **exacte** `scheme+host+port` (jamais
 * `startsWith`/suffixe). Fail-closed si Origin **et** Referer sont absents.
 */

/** Normalise une URL en origine (`scheme://host[:port]`) ou `null` si invalide/wildcard/credentials. */
export function normalizeOrigin(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }
  if (url.username !== "" || url.password !== "") {
    return null;
  }
  if (url.hostname === "" || url.hostname.includes("*")) {
    return null;
  }
  return url.origin;
}

/** Liste des origines autorisées, normalisées (entrées invalides/wildcard ignorées). */
export function parseAllowedOrigins(): string[] {
  const raw = process.env.WEB_ALLOWED_ORIGINS;
  if (raw === undefined || raw.trim() === "") {
    return [];
  }
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const normalized = normalizeOrigin(part.trim());
    if (normalized !== null && !out.includes(normalized)) {
      out.push(normalized);
    }
  }
  return out;
}

/** `true` si `origin` (normalisée) figure exactement dans la liste autorisée. */
export function isOriginAllowed(origin: string, allowed: readonly string[]): boolean {
  const normalized = normalizeOrigin(origin);
  return normalized !== null && allowed.includes(normalized);
}

/**
 * Valide l'origine d'une requête mutative : `Origin` s'il est présent, sinon l'origine de `Referer`.
 * **Fail-closed** : si les deux sont absents, refuse.
 */
export function validateRequestOrigin(
  headers: { origin: string | null; referer: string | null },
  allowed: readonly string[],
): boolean {
  if (headers.origin !== null && headers.origin !== "") {
    return isOriginAllowed(headers.origin, allowed);
  }
  if (headers.referer !== null && headers.referer !== "") {
    return isOriginAllowed(headers.referer, allowed);
  }
  return false;
}
