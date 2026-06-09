/**
 * Configuration SERVEUR UNIQUEMENT.
 *
 * ⚠️ Ne JAMAIS importer ce module depuis un Client Component : il expose `API_INTERNAL_URL`
 * (non préfixée `NEXT_PUBLIC_`) qui ne doit pas atteindre le navigateur. La garantie repose sur la
 * convention documentée + un test statique d'imports (le paquet `server-only` n'est pas utilisé car
 * il lève à l'import sous `node:test` ; cf. README). `API_INTERNAL_URL` est l'URL **interne**
 * (serveur → API), préférée à `NEXT_PUBLIC_API_URL` côté serveur lorsqu'elle existe.
 */
import { normalizeApiBaseUrl } from "./api-url.js";

export interface ServerConfig {
  /** URL d'API interne (serveur). `null` tant que `API_INTERNAL_URL` est absente. */
  readonly apiInternalUrl: string | null;
}

export function getServerConfig(): ServerConfig {
  return {
    apiInternalUrl: process.env.API_INTERNAL_URL ?? null,
  };
}

/** `true` si `API_INTERNAL_URL` est définie (non vide). */
export function isServerApiConfigured(): boolean {
  const raw = process.env.API_INTERNAL_URL;
  return typeof raw === "string" && raw.trim() !== "";
}

/**
 * URL d'API interne **validée et normalisée** (serveur). Lève `ApiUrlError` si absente ou invalide.
 * À n'appeler que côté serveur (factory par requête).
 */
export function getServerApiUrl(): string {
  return normalizeApiBaseUrl(process.env.API_INTERNAL_URL, { varName: "API_INTERNAL_URL" });
}
