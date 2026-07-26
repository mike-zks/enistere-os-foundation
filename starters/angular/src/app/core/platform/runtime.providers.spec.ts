import { TestBed } from '@angular/core/testing';
import { RuntimeErrorHandler, RuntimeLifecycleService } from './runtime.providers';

describe('Angular runtime providers', () => {
  it('maps unhandled errors without serializing the error payload', () => {
    const logSpy = spyOn(console, 'log');
    new RuntimeErrorHandler().handleError();
    expect(logSpy).toHaveBeenCalled();
    expect(logSpy.calls.mostRecent().args[0] as string).not.toContain('password');
  });

  it('exposes lifecycle start and destroy hooks', async () => {
    TestBed.configureTestingModule({ providers: [RuntimeLifecycleService] });
    const lifecycle = TestBed.inject(RuntimeLifecycleService);
    await lifecycle.start();
    expect(() => lifecycle.ngOnDestroy()).not.toThrow();
  });
});
