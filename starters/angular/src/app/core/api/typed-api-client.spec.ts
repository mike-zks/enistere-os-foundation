import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_BASE_URL } from '../config/api-config';
import { TypedApiClient } from './typed-api-client';

describe('TypedApiClient', () => {
  it('preserves the typed health response contract', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_BASE_URL, useValue: 'https://api.example.test' },
      ],
    });
    const client = TestBed.inject(TypedApiClient);
    const controller = TestBed.inject(HttpTestingController);
    let status: string | undefined;
    client.health().subscribe((response) => { status = response.status; });
    controller.expectOne('https://api.example.test/health').flush({ status: 'ok' });
    expect(status).toBe('ok');
    controller.verify();
  });
});
