import {
  createEnistereApiClient,
  defaultRequestIdFactory,
  type EnistereApiClient,
  type EnistereApiClientOptions,
} from "@enistere/api-client-fetch";

import { resolveCookieEnv, type CookieEnv } from "../../auth/cookie-config.js";
import type { ServerCookieStore } from "../../auth/server-cookie-store.js";
import { WebAuthSessionAdapter } from "../../auth/web-session-adapter.js";
import { getServerApiUrl } from "../../config/server-config.js";

type InjectedFetch = NonNullable<EnistereApiClientOptions["fetch"]>;

/**
 * Mode de session :
 * - `read-only` : contexte **sans écriture cookie** (Server Component). Le refresh est **désactivé**
 *   (un refresh nécessiterait d'écrire les nouveaux tokens, impossible ici).
 * - `writable` : contexte **avec écriture cookie** (Route Handler / Server Action). Le refresh est
 *   **activable** (les nouveaux tokens peuvent être posés). NB : aucun refresh réel n'est déclenché
 *   dans la mission Web Auth 1.
 */
export type AuthClientMode = "read-only" | "writable";

export interface AuthenticatedServerApiClientOptions {
  /** Source des cookies (adaptateur `next/headers` en prod, en mémoire en test). */
  readonly cookieStore: ServerCookieStore;
  readonly mode: AuthClientMode;
  readonly env?: CookieEnv;
  /** Base URL explicite (tests). Défaut : `API_INTERNAL_URL` validée. */
  readonly baseUrl?: string;
  /** `fetch` injecté (tests). Défaut : fetch serveur `no-store`. */
  readonly fetch?: InjectedFetch;
  /** Identifiant de corrélation entrant à propager (sinon généré). */
  readonly requestId?: string;
}

/** `fetch` serveur sans cache Next.js : les réponses Auth ne doivent jamais être mises en cache. */
const noStoreFetch: InjectedFetch = (request) => fetch(request, { cache: "no-store" });

/**
 * Factory du client API **serveur authentifiable**, **par requête** (BFF).
 *
 * - **nouvelle instance** à chaque appel ; aucun singleton de session, aucun état mutable de module ;
 * - utilise `API_INTERNAL_URL` (jamais exposée au navigateur) ;
 * - construit un `WebAuthSessionAdapter` sur le `cookieStore` fourni (lecture du Bearer côté serveur) ;
 * - `enableRefresh` **seulement en mode `writable`** (un refresh exigerait d'écrire des cookies) ;
 * - propage un `requestId` entrant si fourni, sinon en génère un.
 *
 * Distinct du **client public** (`core/api/public/`) : il porte une session ; **ne pas** le fusionner.
 */
export function createAuthenticatedServerApiClient(
  options: AuthenticatedServerApiClientOptions,
): EnistereApiClient {
  const env = options.env ?? resolveCookieEnv();
  const session = new WebAuthSessionAdapter({ cookieStore: options.cookieStore, env });
  const baseUrl = options.baseUrl ?? getServerApiUrl();
  const incomingId = options.requestId;

  return createEnistereApiClient({
    baseUrl,
    fetch: options.fetch ?? noStoreFetch,
    session,
    enableRefresh: options.mode === "writable",
    createRequestId: incomingId !== undefined ? () => incomingId : defaultRequestIdFactory,
  });
}
