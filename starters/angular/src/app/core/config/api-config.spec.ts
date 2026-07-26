import { TestBed } from '@angular/core/testing';
import { APP_BASE_URL, validateApiBaseUrl } from './api-config';

describe('APP_BASE_URL', () => {
  it('is injectable with a provided value', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: APP_BASE_URL, useValue: 'http://localhost:3000' }],
    });
    const url = TestBed.inject(APP_BASE_URL);
    expect(url).toBe('http://localhost:3000');
  });

  it('is injectable with an empty string (relative URL mode)', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: APP_BASE_URL, useValue: '' }],
    });
    const url = TestBed.inject(APP_BASE_URL);
    expect(url).toBe('');
  });

  it('validates and normalizes typed public configuration', () => {
    expect(validateApiBaseUrl('https://api.example.test/')).toBe('https://api.example.test');
    expect(validateApiBaseUrl(undefined)).toBe('');
    expect(() => validateApiBaseUrl('https://user:secret@example.test')).toThrow();
  });
});
