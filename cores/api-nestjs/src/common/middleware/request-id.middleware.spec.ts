import { Request, Response } from 'express';

import { REQUEST_ID_HEADER, requestIdMiddleware } from './request-id.middleware';

function run(headerValue?: string | string[]): { id: string; setHeader: jest.Mock } {
  const setHeader = jest.fn();
  const req = { headers: headerValue === undefined ? {} : { 'x-request-id': headerValue } } as unknown as Request;
  const res = { setHeader } as unknown as Response;
  const next = jest.fn();
  requestIdMiddleware(req, res, next);
  expect(next).toHaveBeenCalledTimes(1);
  return { id: req.requestId as string, setHeader };
}

describe('requestIdMiddleware', () => {
  it('keeps a well-formed incoming request id and echoes it', () => {
    const { id, setHeader } = run('req-abc_123.456');
    expect(id).toBe('req-abc_123.456');
    expect(setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, 'req-abc_123.456');
  });

  it('generates a UUID when no id is provided', () => {
    const { id } = run();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('rejects an id with control characters (anti log-injection) and generates one instead', () => {
    const { id } = run('evil\r\nSet-Cookie: x=y');
    expect(id).not.toContain('\r');
    expect(id).not.toContain('\n');
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('rejects a too-short or too-long id', () => {
    expect(run('short').id).toMatch(/^[0-9a-f-]{36}$/);
    expect(run('x'.repeat(200)).id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('takes the first value when the header is an array', () => {
    expect(run(['req-aaaaaaaa', 'req-bbbbbbbb']).id).toBe('req-aaaaaaaa');
  });
});
