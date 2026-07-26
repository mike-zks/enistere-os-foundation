import {
  createEnistereApiClient,
  defaultRequestIdFactory,
  type EnistereApiClient,
  type EnistereApiClientOptions,
} from "@enistere/api-client-fetch";

import { getServerApiUrl } from "../../config/server-config.js";
import { withRequestContext } from "../../platform/runtime-contract.js";

type InjectedFetch = NonNullable<EnistereApiClientOptions["fetch"]>;

export interface ServerApiClientOptions {
  /** Base URL explicite (tests). Défaut : `API_INTERNAL_URL` validée. */
  readonly baseUrl?: string;
  /** `fetch` injecté (tests). Défaut : fetch serveur `no-store`. */
  readonly fetch?: InjectedFetch;
  /** Identifiant de corrélation entrant à propager (sinon généré). */
  readonly requestId?: string;
}

/** `fetch` serveur sans cache Next.js : les sondes Health décrivent l'état **courant**. */
const noStoreFetch: InjectedFetch = (request) => fetch(request, { cache: "no-store" });

/**
 * Factory API **serveur, par requête**.
 *
 * - **nouvelle instance** à chaque appel (aucun client global serveur) ;
 * - aucune **session**, aucun **Bearer**, aucun **refresh** (`enableRefresh:false`) ;
 * - aucun **état mutable** au niveau module ;
 * - utilise `API_INTERNAL_URL` (jamais exposée au navigateur) ;
 * - `fetch` `no-store` par défaut (injectable en test) ;
 * - propage un `requestId` entrant si fourni, sinon en génère un.
 */
export function createServerApiClient(options?: ServerApiClientOptions): EnistereApiClient {
  const baseUrl = options?.baseUrl ?? getServerApiUrl();
  const incomingId = options?.requestId;
  return createEnistereApiClient({
    baseUrl,
    fetch: withRequestContext(options?.fetch ?? noStoreFetch, { requestId: incomingId }),
    enableRefresh: false,
    createRequestId: incomingId !== undefined ? () => incomingId : defaultRequestIdFactory,
  });
}
