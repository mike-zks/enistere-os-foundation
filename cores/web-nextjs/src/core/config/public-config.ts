/**
 * Configuration PUBLIQUE (sûre côté client).
 *
 * Ne lit que des variables non sensibles : `APP_ENV` et les variables `NEXT_PUBLIC_*`.
 * Aucun secret/token ne doit transiter ici. `NEXT_PUBLIC_API_URL` est l'URL **publique** consommée
 * par le client navigateur (endpoints Health, Web 2) ; elle est facultative — sans elle, l'intégration
 * API publique est « non configurée » (les hooks restent désactivés, l'UI l'affiche).
 */
import { normalizeApiBaseUrl } from "./api-url.js";

export type AppEnv = "development" | "test" | "production";

function readAppEnv(): AppEnv {
  const raw = process.env.APP_ENV ?? process.env.NODE_ENV ?? "development";
  if (raw === "production" || raw === "test") {
    return raw;
  }
  return "development";
}

export interface PublicConfig {
  /** Nom d'application exposé au client. */
  readonly appName: string;
  /** Environnement applicatif logique. */
  readonly appEnv: AppEnv;
  /** URL d'API publique (client). `null` en Web 1 (aucun appel API). */
  readonly apiBaseUrl: string | null;
}

export const publicConfig: PublicConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Enistère",
  appEnv: readAppEnv(),
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL ?? null,
};

/** `true` si `NEXT_PUBLIC_API_URL` est définie (non vide) — l'API publique est alors configurée. */
export function isPublicApiConfigured(): boolean {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  return typeof raw === "string" && raw.trim() !== "";
}

/**
 * URL d'API publique **validée et normalisée** (client navigateur). Lève `ApiUrlError` si absente
 * ou invalide. À n'appeler que lorsque `isPublicApiConfigured()` est vrai (sinon « non configuré »).
 */
export function getPublicApiUrl(): string {
  return normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL, { varName: "NEXT_PUBLIC_API_URL" });
}
