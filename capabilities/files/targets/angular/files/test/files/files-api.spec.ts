import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_BASE_URL } from '../../../core/config/api-config';
import { FilesApi } from '../files-api';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const ITEM = {
  id: ID, originalName: 'server-sanitized.pdf', mimeType: 'application/pdf',
  size: 3, category: 'DOCUMENT' as const, createdAt: '2026-08-01T00:00:00Z',
};

describe('FilesApi', () => {
  let api: FilesApi;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(), FilesApi,
      { provide: APP_BASE_URL, useValue: 'https://api.example.test' },
    ] });
    api = TestBed.inject(FilesApi);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  // FILES-CLIENT-003
  it('demande une page explicite sans cookie ni cache client de session', async () => {
    const result = api.list(20, 40);
    const request = backend.expectOne((candidate) => (
      candidate.url === 'https://api.example.test/api/v1/files'
      && candidate.params.get('limit') === '20' && candidate.params.get('offset') === '40'
    ));
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBeFalse();
    request.flush({ items: [ITEM], nextOffset: null, total: 1 });
    expect((await result).items).toEqual([ITEM]);
  });

  // FILES-CLIENT-002
  it('envoie le multipart par HttpClient authentifiable sans forcer Content-Type ni créance ambiante', async () => {
    const file = new File(['pdf'], 'local-secret.pdf', { type: 'application/pdf' });
    const result = api.upload({ file, category: 'DOCUMENT', subjectId: 'invoice-42' });
    const request = backend.expectOne('https://api.example.test/api/v1/files/upload');
    expect(request.request.method).toBe('POST');
    expect(request.request.body instanceof FormData).toBeTrue();
    expect(request.request.headers.has('Content-Type')).toBeFalse();
    expect(request.request.withCredentials).toBeFalse();
    request.flush({ success: true, data: ITEM, timestamp: '2026-08-01T00:00:00Z' });
    expect(await result).toEqual(ITEM);
  });

  // FILES-CLIENT-004
  it('demande au serveur une URL signée par une commande non cacheable', async () => {
    const result = api.issueDownloadUrl(ID);
    const request = backend.expectOne(`https://api.example.test/api/v1/files/${ID}/download-url`);
    expect(request.request.method).toBe('POST');
    request.flush({ url: 'https://storage.example.test/signed', expiresIn: 300 });
    expect((await result).url).toContain('/signed');
  });

  // FILES-CLIENT-005, FILES-CLIENT-006
  it('porte suppression, quarantaine et restore par le client Http authentifié sans cookie', async () => {
    const deletion = api.delete(ID);
    const deleteRequest = backend.expectOne(`https://api.example.test/api/v1/files/${ID}`);
    expect(deleteRequest.request.method).toBe('DELETE');
    expect(deleteRequest.request.withCredentials).toBeFalse();
    deleteRequest.flush(null, { status: 204, statusText: 'No Content' });
    await deletion;

    const quarantine = api.quarantine(ID);
    const quarantineRequest = backend.expectOne(`https://api.example.test/api/v1/files/${ID}/quarantine`);
    expect(quarantineRequest.request.method).toBe('POST');
    expect(quarantineRequest.request.withCredentials).toBeFalse();
    quarantineRequest.flush(null);
    await quarantine;

    const restore = api.restore(ID);
    const restoreRequest = backend.expectOne(`https://api.example.test/api/v1/files/${ID}/restore`);
    expect(restoreRequest.request.method).toBe('POST');
    restoreRequest.flush(null);
    await restore;
  });
});
