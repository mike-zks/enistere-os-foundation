/**
 * Client Enistere : façade stable au-dessus d'`openapi-fetch`, typée par `@enistere/api-contracts`.
 * Gère Bearer (via adaptateur), corrélation X-Request-Id, credentials web optionnels, timeout,
 * refresh coordonné et rejeu unique. Indépendant de TanStack Query et de tout framework UI.
 */
import type { paths } from '@enistere/api-contracts';
import createClient, { type Client, type ClientOptions } from 'openapi-fetch';

import type { AuthSessionAdapter } from '../auth/auth-session-adapter.js';
import { defaultRequestIdFactory, type RequestIdFactory } from '../request/request-id.js';
import { AuthApi } from './auth-api.js';
import { FilesApi } from './files-api.js';
import { Transport } from './transport.js';

export interface EnistereApiClientOptions {
  /** Base URL de l'API (obligatoire). */
  baseUrl: string;
  /** `fetch` injectable (tests / SSR / React Native). Par défaut : `globalThis.fetch`. */
  fetch?: ClientOptions['fetch'];
  /** `include` pour le futur mode cookies web ; optionnel, par instance (jamais imposé). */
  credentials?: ClientOptions['credentials'];
  /** Stockage de session (Bearer + refresh). Sans adaptateur : client non authentifié. */
  session?: AuthSessionAdapter;
  /** Délai par requête (ms). Défaut : 15000. */
  timeoutMs?: number;
  /** Active le refresh coordonné sur 401 (nécessite une session). Défaut : true. */
  enableRefresh?: boolean;
  /** Fabrique d'identifiant de corrélation (posé en X-Request-Id s'il est absent). */
  createRequestId?: RequestIdFactory;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const REQUEST_ID_HEADER = 'X-Request-Id';

export class EnistereApiClient {
  /** Façade d'authentification. */
  readonly auth: AuthApi;
  /** Façade fichiers. */
  readonly files: FilesApi;

  private readonly rawClient: Client<paths>;

  constructor(options: EnistereApiClientOptions) {
    if (!options.baseUrl) {
      throw new Error('EnistereApiClient: baseUrl is required.');
    }
    const session = options.session;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const refreshEnabled = (options.enableRefresh ?? true) && session !== undefined;
    const createRequestId = options.createRequestId;

    const clientOptions: ClientOptions = { baseUrl: options.baseUrl };
    if (options.fetch) {
      clientOptions.fetch = options.fetch;
    }
    if (options.credentials) {
      clientOptions.credentials = options.credentials;
    }
    this.rawClient = createClient<paths>(clientOptions);

    // Injection Bearer + corrélation via middleware (jamais de token en clair ailleurs).
    this.rawClient.use({
      onRequest: async ({ request }) => {
        if (session) {
          const token = await session.getAccessToken();
          if (token && !request.headers.has('Authorization')) {
            request.headers.set('Authorization', `Bearer ${token}`);
          }
        }
        if (createRequestId && !request.headers.has(REQUEST_ID_HEADER)) {
          request.headers.set(REQUEST_ID_HEADER, createRequestId());
        }
        return request;
      },
    });

    const transport = new Transport(this.rawClient, session, timeoutMs, refreshEnabled);
    this.auth = new AuthApi(transport);
    this.files = new FilesApi(transport);
  }

  /** Accès bas niveau contrôlé au client `openapi-fetch` (échappatoire typée). */
  get raw(): Client<paths> {
    return this.rawClient;
  }
}

export function createEnistereApiClient(options: EnistereApiClientOptions): EnistereApiClient {
  return new EnistereApiClient(options);
}

export { defaultRequestIdFactory };
