import {
  createEnistereApiClient,
  defaultRequestIdFactory,
  type EnistereApiClient,
  type EnistereApiClientOptions,
} from "@enistere/api-client-fetch";

import { resolveCookieEnv, type CookieEnv } from "../cookie-config.js";
import type { ServerCookieStore } from "../server-cookie-store.js";
import { WebAuthSessionAdapter } from "../web-session-adapter.js";
import { getServerApiUrl } from "../../../core/config/server-config.js";

type InjectedFetch = NonNullable<EnistereApiClientOptions["fetch"]>;

/**
 * `fetch` serveur du client authentifié (BFF → API).
 *
 * **Bufferise le corps de la requête** (`arrayBuffer`) et reconstruit l'appel via `(url, init)`, de
 * sorte que le corps soit **rejouable** : sous le `fetch` patché de Next.js, un `Request` POST
 * (corps en flux) pouvait échouer avec `expected non-null body source` (corps non rejouable lors d'un
 * réessai/instrumentation) — l'erreur remontait alors à tort en « réseau » (502). La **réponse** est
 * aussi re-bufferisée (lecture/`clone` fiables par `openapi-fetch`). Routes Auth = POST `force-dynamic`
 * → aucune mise en cache en jeu.
 */
const serverFetch: InjectedFetch = async (request) => {
  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const requestBody = hasBody ? await request.arrayBuffer() : undefined;

  const upstream = await fetch(request.url, {
    method,
    headers: request.headers,
    body: requestBody,
    signal: request.signal,
    redirect: "manual",
  });

  const responseBody = await upstream.arrayBuffer();
  return new Response(upstream.status === 204 || upstream.status === 304 ? null : responseBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });
};

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
    fetch: options.fetch ?? serverFetch,
    session,
    enableRefresh: options.mode === "writable",
    createRequestId: incomingId !== undefined ? () => incomingId : defaultRequestIdFactory,
  });
}
