export const PUSH_HOOK_CONTRACT_VERSION = 'push-hook/2.0.0';

export interface PushHook {
  readonly contractVersion: typeof PUSH_HOOK_CONTRACT_VERSION;
  readonly enabled: boolean;
  register(): Promise<'disabled' | 'registered'>;
  unregister(): Promise<void>;
}

export function createDisabledPushHook(): PushHook {
  return Object.freeze({
    contractVersion: PUSH_HOOK_CONTRACT_VERSION,
    enabled: false,
    register: async (): Promise<'disabled'> => 'disabled',
    unregister: async () => undefined,
  });
}
