import { RuntimeLifecycleService } from './runtime-lifecycle.service';

describe('RuntimeLifecycleService', () => {
  it('moves through ready, draining and stopped and closes hooks in reverse order', async () => {
    const lifecycle = new RuntimeLifecycleService();
    const calls: string[] = [];
    lifecycle.registerShutdownHook(() => { calls.push('first'); });
    lifecycle.registerShutdownHook(async () => {
      await Promise.resolve();
      calls.push('second');
    });

    lifecycle.onApplicationBootstrap();
    expect(lifecycle.currentState()).toBe('ready');
    await lifecycle.beforeApplicationShutdown();
    expect(lifecycle.currentState()).toBe('draining');
    expect(calls).toEqual(['second', 'first']);

    await lifecycle.beforeApplicationShutdown();
    expect(calls).toEqual(['second', 'first']);
    lifecycle.onApplicationShutdown();
    expect(lifecycle.currentState()).toBe('stopped');
  });
});
