import { of, throwError } from 'rxjs';
import { toArray } from 'rxjs/operators';
import {
  createRequestState,
  errorState,
  idleState,
  loadingState,
  successState,
  type RequestState,
} from './request-state';
import type { AppApiError } from '../errors/app-api-error';

describe('RequestState factories', () => {
  it('idleState produces idle status', () => {
    const s = idleState<string>();
    expect(s.status).toBe('idle');
    expect(s.data).toBeNull();
    expect(s.error).toBeNull();
  });

  it('loadingState produces loading status', () => {
    const s = loadingState<number>();
    expect(s.status).toBe('loading');
    expect(s.data).toBeNull();
    expect(s.error).toBeNull();
  });

  it('successState carries data', () => {
    const s = successState({ id: 1 });
    expect(s.status).toBe('success');
    expect(s.data).toEqual({ id: 1 });
    expect(s.error).toBeNull();
  });

  it('errorState carries AppApiError', () => {
    const err: AppApiError = { code: 'NotFound', statusCode: 404, requestId: null };
    const s = errorState<string>(err);
    expect(s.status).toBe('error');
    expect(s.error).toEqual(err);
    expect(s.data).toBeNull();
  });
});

describe('createRequestState', () => {
  function collect<T>(states: RequestState<T>[]): RequestState<T>[] {
    return states;
  }

  it('emits loading then success for a synchronous source', (done) => {
    const emissions: RequestState<number>[] = [];
    createRequestState(of(42)).subscribe({
      next: (s) => emissions.push(s),
      complete: () => {
        expect(emissions).toHaveSize(2);
        expect(emissions[0].status).toBe('loading');
        expect(emissions[1].status).toBe('success');
        expect(emissions[1].data).toBe(42);
        done();
      },
    });
  });

  it('emits loading then error for a failed source', (done) => {
    const appError: AppApiError = { code: 'NotFound', statusCode: 404, requestId: null };
    const emissions: RequestState<number>[] = [];
    createRequestState(throwError(() => appError)).subscribe({
      next: (s) => emissions.push(s),
      complete: () => {
        expect(emissions).toHaveSize(2);
        expect(emissions[0].status).toBe('loading');
        expect(emissions[1].status).toBe('error');
        expect(emissions[1].error).toEqual(appError);
        done();
      },
    });
  });

  it('wraps non-AppApiError in Unknown error state', (done) => {
    const emissions: RequestState<string>[] = [];
    createRequestState(throwError(() => new Error('network problem'))).subscribe({
      next: (s) => emissions.push(s),
      complete: () => {
        const errState = emissions[1];
        expect(errState.status).toBe('error');
        expect(errState.error?.code).toBe('Unknown');
        done();
      },
    });
  });

  it('does not emit after error (stream completes)', (done) => {
    let count = 0;
    createRequestState(throwError(() => ({ code: 'ServerError', statusCode: 500, requestId: null }))).subscribe({
      next: () => count++,
      complete: () => {
        expect(count).toBe(2); // loading + error
        done();
      },
    });
  });

  it('success state data is not null', (done) => {
    createRequestState(of({ name: 'Enistere' })).subscribe({
      complete: () => done(),
      next: (s) => {
        if (s.status === 'success') {
          expect(s.data).not.toBeNull();
          expect(s.data?.name).toBe('Enistere');
        }
      },
    });
  });
});
