/**
 * Configuration PUBLIQUE (sûre côté client).
 *
 * Ne lit que des variables non sensibles : `APP_ENV` et les variables `NEXT_PUBLIC_*`.
 * Aucun secret/token ne doit transiter ici. En Web 1, aucune URL d'API n'est requise
 * (aucun appel réseau) : `apiBaseUrl` reste `null` tant que `NEXT_PUBLIC_API_URL` est absente.
 */
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
