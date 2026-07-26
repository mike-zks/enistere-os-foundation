import {
  createMobileRequestContext,
  mapCanonicalMobileError,
  type CanonicalMobileError,
  type MobileRequestContext,
} from '../platform/runtime-contract';

export interface MobileTransportResponse<T> {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<T>;
}

export type MobileTransport = (
  path: string,
  init: Readonly<{ method: string; headers: Readonly<Record<string, string>> }>,
) => Promise<MobileTransportResponse<unknown>>;

export class MobileApiError extends Error {
  constructor(readonly response: CanonicalMobileError) {
    super(response.message);
    this.name = 'MobileApiError';
  }
}

export class TypedMobileApiClient {
  constructor(
    private readonly transport: MobileTransport,
    private readonly contextFactory: () => MobileRequestContext = () =>
      createMobileRequestContext({
        requestId: 'mobile-request',
        nextTraceId: () => '1'.repeat(32),
        nextSpanId: () => '2'.repeat(16),
      }),
  ) {}

  async request<T>(path: string, method = 'GET'): Promise<T> {
    const context = this.contextFactory();
    const response = await this.transport(path, {
      method,
      headers: {
        'X-Request-Id': context.requestId,
        traceparent: context.traceparent,
      },
    });
    const body = await response.json();
    if (!response.ok) throw new MobileApiError(mapCanonicalMobileError(body));
    return body as T;
  }
}
