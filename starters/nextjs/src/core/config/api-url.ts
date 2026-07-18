/**
 * Validation & normalisation d'une URL de base d'API.
 *
 * Sans dépendance Next ni serveur — pur, testable sous node:test. Règles (strategy 07_SECURITY,
 * 08_STANDARDS) : protocole `http`/`https`, URL **absolue**, **aucun credential** dans l'URL,
 * **trailing slash** normalisé, **wildcard** rejeté. Lève `ApiUrlError` (message générique, sans secret).
 */
export class ApiUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiUrlError";
  }
}

export interface NormalizeApiUrlOptions {
  /** Nom de la variable, pour des messages d'erreur lisibles. */
  readonly varName?: string;
}

/**
 * Valide puis normalise une URL de base. Retourne `origin + pathname` sans slash final
 * (search/hash ignorés). Lève `ApiUrlError` si invalide.
 */
export function normalizeApiBaseUrl(
  raw: string | undefined | null,
  options?: NormalizeApiUrlOptions,
): string {
  const name = options?.varName ?? "API URL";
  if (raw === undefined || raw === null || raw.trim() === "") {
    throw new ApiUrlError(`${name} : valeur manquante.`);
  }
  const value = raw.trim();

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ApiUrlError(`${name} : URL absolue invalide.`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ApiUrlError(`${name} : protocole non supporté (http/https attendu).`);
  }
  if (url.username !== "" || url.password !== "") {
    throw new ApiUrlError(`${name} : credentials interdits dans l'URL.`);
  }
  if (url.hostname === "" || url.hostname.includes("*")) {
    throw new ApiUrlError(`${name} : hôte invalide (wildcard interdit).`);
  }

  const path = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${path}`;
}
