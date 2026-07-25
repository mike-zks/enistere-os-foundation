import {
  BeforeApplicationShutdown,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';

export type RuntimeLifecycleState = 'starting' | 'ready' | 'draining' | 'stopped';
export type ShutdownHook = () => void | Promise<void>;

/**
 * Point de coordination du lifecycle. Les hooks sont exécutés en ordre inverse
 * d'inscription afin de fermer d'abord les dépendances les plus récentes.
 */
@Injectable()
export class RuntimeLifecycleService
  implements OnApplicationBootstrap, BeforeApplicationShutdown, OnApplicationShutdown
{
  private state: RuntimeLifecycleState = 'starting';
  private readonly shutdownHooks: ShutdownHook[] = [];

  onApplicationBootstrap(): void {
    this.state = 'ready';
  }

  registerShutdownHook(hook: ShutdownHook): void {
    if (this.state === 'draining' || this.state === 'stopped') {
      throw new Error(`Cannot register a shutdown hook while runtime is ${this.state}`);
    }
    this.shutdownHooks.push(hook);
  }

  async beforeApplicationShutdown(): Promise<void> {
    if (this.state === 'draining' || this.state === 'stopped') return;
    this.state = 'draining';
    for (const hook of [...this.shutdownHooks].reverse()) {
      await hook();
    }
  }

  onApplicationShutdown(): void {
    this.state = 'stopped';
  }

  currentState(): RuntimeLifecycleState {
    return this.state;
  }
}
