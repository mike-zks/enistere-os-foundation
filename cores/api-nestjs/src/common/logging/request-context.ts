import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Contexte de corrélation propagé automatiquement aux logs (HTTP et hors-HTTP). Une **seule**
 * instance `AsyncLocalStorage` : pas de contexte global mutable, pas de fuite entre requêtes.
 * Hors HTTP (CLI/jobs), `operationId` joue le rôle de corrélation. `requestId` réutilise le
 * `X-Request-Id` existant (jamais un second identifiant).
 */
export interface RequestContext {
  requestId?: string;
  operationId?: string;
  userId?: string;
  sessionId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(context: RequestContext, callback: () => T): T {
  return storage.run(context, callback);
}

export function getRequestContext(): RequestContext | undefined {
  return storage.getStore();
}

/** Enrichit le contexte courant après authentification (UUID uniquement ; jamais email/token/rôles). */
export function setAuthenticatedContext(userId: string, sessionId?: string): void {
  const store = storage.getStore();
  if (!store) {
    return;
  }
  store.userId = userId;
  if (sessionId) {
    store.sessionId = sessionId;
  }
}

/** Champs de contexte non vides, pour injection (mixin) dans chaque log. */
export function currentContextFields(): RequestContext {
  const store = storage.getStore();
  if (!store) {
    return {};
  }
  const fields: RequestContext = {};
  if (store.requestId) {
    fields.requestId = store.requestId;
  }
  if (store.operationId) {
    fields.operationId = store.operationId;
  }
  if (store.userId) {
    fields.userId = store.userId;
  }
  if (store.sessionId) {
    fields.sessionId = store.sessionId;
  }
  return fields;
}
