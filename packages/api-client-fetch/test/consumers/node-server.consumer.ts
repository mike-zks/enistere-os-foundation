/**
 * Fixture de COMPILATION (non exécutée) — consommateur Node/Next.js SERVEUR.
 * Factory par requête, `fetch` injecté, aucune référence à `window`, aucun singleton authentifié.
 */
import {
  createEnistereApiClient,
  type AuthSessionAdapter,
  type EnistereApiClient,
} from '../../src/index.js';

export interface ServerRequestContext {
  baseUrl: string;
  fetch: typeof globalThis.fetch;
  session: AuthSessionAdapter;
  requestId?: string;
}

export function apiClientForRequest(ctx: ServerRequestContext): EnistereApiClient {
  return createEnistereApiClient({
    baseUrl: ctx.baseUrl,
    fetch: ctx.fetch,
    session: ctx.session,
    ...(ctx.requestId ? { createRequestId: () => ctx.requestId as string } : {}),
  });
}

export async function loadProfile(ctx: ServerRequestContext): Promise<string> {
  const client = apiClientForRequest(ctx);
  const profile = await client.auth.getProfile();
  return profile.email;
}
