import type { EnistereApiClientOptions } from "@enistere/api-client-fetch";

import type { CookieEnv } from "../cookie-config.js";
import type { ServerCookieStore } from "../server-cookie-store.js";

type InjectedFetch = NonNullable<EnistereApiClientOptions["fetch"]>;

/**
 * Dépendances d'un handler Auth BFF (injectables → testables sans Next). En production, les routes
 * fournissent le cookie store (`next/headers`), l'environnement et les origines autorisées ; en test,
 * tout est injecté (cookie store mémoire, `fetch` mock, base URL).
 */
export interface AuthHandlerDeps {
  readonly cookieStore: ServerCookieStore;
  readonly env: CookieEnv;
  readonly allowedOrigins: readonly string[];
  readonly fetch?: InjectedFetch;
  readonly baseUrl?: string;
}
