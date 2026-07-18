import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { isAppApiError, mapHttpError, type ApiErrorCode } from './app-api-error';

function makeHttpError(status: number, headers?: Record<string, string>): HttpErrorResponse {
  return new HttpErrorResponse({
    status,
    headers: new HttpHeaders(headers ?? {}),
    url: '/api/test',
  });
}

describe('mapHttpError', () => {
  it('returns NetworkError for status 0 (no response)', () => {
    const err = new HttpErrorResponse({ status: 0, url: '/api/test' });
    const result = mapHttpError(err);
    expect(result.code).toBe('NetworkError');
    expect(result.statusCode).toBeNull();
    expect(result.requestId).toBeNull();
  });

  const statusCodes: Array<[number, ApiErrorCode]> = [
    [400, 'BadRequest'],
    [401, 'Unauthorized'],
    [403, 'Forbidden'],
    [404, 'NotFound'],
    [409, 'Conflict'],
    [413, 'FileTooLarge'],
    [415, 'UnsupportedType'],
    [422, 'ValidationError'],
    [429, 'RateLimited'],
    [500, 'ServerError'],
    [502, 'ServerError'],
    [503, 'ServerError'],
  ];

  statusCodes.forEach(([status, code]) => {
    it(`maps ${status} → ${code}`, () => {
      const result = mapHttpError(makeHttpError(status));
      expect(result.code).toBe(code);
      expect(result.statusCode).toBe(status);
    });
  });

  it('maps unknown 4xx → Unknown', () => {
    const result = mapHttpError(makeHttpError(418));
    expect(result.code).toBe('Unknown');
  });

  it('extracts x-request-id from response headers', () => {
    const err = makeHttpError(404, { 'x-request-id': 'req-abc-123' });
    const result = mapHttpError(err);
    expect(result.requestId).toBe('req-abc-123');
  });

  it('sets requestId to null when x-request-id header is absent', () => {
    const result = mapHttpError(makeHttpError(404));
    expect(result.requestId).toBeNull();
  });

  it('does not expose body or raw error message', () => {
    const err = new HttpErrorResponse({
      status: 400,
      error: { message: 'sensitive-data', password: 'secret' },
      url: '/api/test',
    });
    const result = mapHttpError(err);
    expect(JSON.stringify(result)).not.toContain('sensitive-data');
    expect(JSON.stringify(result)).not.toContain('secret');
  });
});

describe('isAppApiError', () => {
  it('returns true for a valid AppApiError', () => {
    expect(isAppApiError({ code: 'NotFound', statusCode: 404, requestId: null })).toBeTrue();
  });

  it('returns false for null', () => {
    expect(isAppApiError(null)).toBeFalse();
  });

  it('returns false for a plain Error', () => {
    expect(isAppApiError(new Error('oops'))).toBeFalse();
  });

  it('returns false for an object missing required keys', () => {
    expect(isAppApiError({ code: 'NotFound' })).toBeFalse();
  });
});
