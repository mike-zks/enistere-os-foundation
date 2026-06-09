/**
 * Fixture de COMPILATION (non exécutée) — consommateur NAVIGATEUR.
 * `fetch` standard, credentials optionnels, `crypto.randomUUID` natif, aucun secret serveur.
 */
import {
  createEnistereApiClient,
  defaultRequestIdFactory,
  type AuthSessionAdapter,
  type EnistereApiClient,
} from '../../src/index.js';

export function browserApiClient(baseUrl: string, session: AuthSessionAdapter): EnistereApiClient {
  return createEnistereApiClient({
    baseUrl,
    session,
    credentials: 'include',
    createRequestId: defaultRequestIdFactory,
  });
}
