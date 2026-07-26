export const OFFLINE_HOOK_CONTRACT_VERSION = 'offline-hook/2.0.0';

export interface OfflineHook {
  readonly contractVersion: typeof OFFLINE_HOOK_CONTRACT_VERSION;
  readonly enabled: boolean;
  enqueue(operation: Readonly<{ id: string; kind: string }>): Promise<'queued' | 'disabled'>;
}

export function createDisabledOfflineHook(): OfflineHook {
  return Object.freeze({
    contractVersion: OFFLINE_HOOK_CONTRACT_VERSION,
    enabled: false,
    enqueue: async (): Promise<'disabled'> => 'disabled',
  });
}
