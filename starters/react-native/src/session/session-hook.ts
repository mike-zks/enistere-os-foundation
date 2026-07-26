export const SESSION_HOOK_CONTRACT_VERSION = 'session-hook/2.0.0';

export type SessionState = 'unknown' | 'anonymous' | 'authenticated';

export interface SessionHook {
  readonly contractVersion: typeof SESSION_HOOK_CONTRACT_VERSION;
  current(): SessionState;
  subscribe(listener: (state: SessionState) => void): () => void;
}

export function createAnonymousSessionHook(): SessionHook {
  return Object.freeze({
    contractVersion: SESSION_HOOK_CONTRACT_VERSION,
    current: () => 'anonymous',
    subscribe: () => () => undefined,
  });
}
