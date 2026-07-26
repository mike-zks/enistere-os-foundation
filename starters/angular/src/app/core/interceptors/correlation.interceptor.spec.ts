import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { correlationInterceptor } from './correlation.interceptor';

describe('correlationInterceptor', () => {
  it('preserves a safe request id and continues W3C trace with a new span', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([correlationInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    http.get('/health', {
      headers: {
        'X-Request-Id': 'web-request-1234',
        traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
      },
    }).subscribe();
    const request = controller.expectOne('/health');
    expect(request.request.headers.get('X-Request-Id')).toBe('web-request-1234');
    expect(request.request.headers.get('traceparent'))
      .toMatch(/^00-4bf92f3577b34da6a3ce929d0e0e4736-[0-9a-f]{16}-01$/);
    expect(request.request.headers.get('traceparent')).not.toContain('00f067aa0ba902b7');
    request.flush({ status: 'ok' });
    controller.verify();
  });
});
