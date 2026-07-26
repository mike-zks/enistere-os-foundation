import {
  ErrorHandler,
  EnvironmentProviders,
  Injectable,
  OnDestroy,
  Provider,
  inject,
  provideAppInitializer,
} from '@angular/core';
import {
  runtimeDiagnostics,
  runtimeLifecycle,
  runtimeLogger,
  technicalAudit,
} from './runtime-contract';

@Injectable({ providedIn: 'root' })
export class RuntimeErrorHandler implements ErrorHandler {
  handleError(): void {
    runtimeLogger.write('error', 'web.unhandled-error');
    technicalAudit.emit('runtime.error', { reason: 'unhandled-client-error' });
  }
}

@Injectable({ providedIn: 'root' })
export class RuntimeLifecycleService implements OnDestroy {
  constructor() {
    runtimeDiagnostics.register('web.runtime', () => ({ id: 'web.runtime', status: 'ready' }));
    runtimeLifecycle.register({
      id: 'web.runtime',
      start: () => technicalAudit.emit('runtime.started'),
      stop: () => technicalAudit.emit('runtime.stopped'),
    });
  }

  async start(): Promise<void> {
    await runtimeLifecycle.start();
  }

  ngOnDestroy(): void {
    void runtimeLifecycle.stop();
  }
}

export const WEB_RUNTIME_PROVIDERS: readonly (Provider | EnvironmentProviders)[] = [
  { provide: ErrorHandler, useClass: RuntimeErrorHandler },
  provideAppInitializer(() => inject(RuntimeLifecycleService).start()),
];
