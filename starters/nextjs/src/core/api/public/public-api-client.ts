import {
  createEnistereApiClient,
  defaultRequestIdFactory,
  type EnistereApiClient,
  type EnistereApiClientOptions,
} from "@enistere/api-client-fetch";

import { getPublicApiUrl } from "../../config/public-config.js";

type InjectedFetch = NonNullable<EnistereApiClientOptions["fetch"]>;

export interface PublicApiClientOptions {
  /** Base URL publique (validée par l'appelant ou les tests). */
  readonly baseUrl: string;
  /** `fetch` injecté (tests). Défaut : fetch global du navigateur. */
  readonly fetch?: InjectedFetch;
}

/**
 * Crée un client API **public** :
 *
 * - **aucune session**, **aucun Bearer**, **aucun refresh** (`enableRefresh:false`) ;
 * - corrélation **X-Request-Id** (`crypto.randomUUID()` via la fabrique du paquet) ;
 * - destiné aux endpoints **publics** (Health) côté navigateur.
 *
 * ⚠️ Ce client public **ne doit pas** devenir le futur client authentifié (qui passera par un BFF +
 * cookies `HttpOnly`). Voir `src/core/auth/README.md`.
 */
export function createPublicApiClient(options: PublicApiClientOptions): EnistereApiClient {
  return createEnistereApiClient({
    baseUrl: options.baseUrl,
    fetch: options.fetch,
    enableRefresh: false,
    createRequestId: defaultRequestIdFactory,
  });
}

let cached: EnistereApiClient | null = null;

/**
 * Singleton navigateur du client public (acceptable car **sans session ni état d'authentification**).
 * Lève si `NEXT_PUBLIC_API_URL` est absente/invalide — à n'appeler que si l'API publique est configurée.
 */
export function getPublicApiClient(): EnistereApiClient {
  if (cached === null) {
    cached = createPublicApiClient({ baseUrl: getPublicApiUrl() });
  }
  return cached;
}

/** Réinitialise le singleton — **tests uniquement**. */
export function resetPublicApiClientForTests(): void {
  cached = null;
}
