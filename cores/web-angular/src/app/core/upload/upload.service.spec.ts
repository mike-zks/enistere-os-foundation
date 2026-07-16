import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { APP_BASE_URL } from '../config/api-config';
import { errorInterceptor } from '../interceptors/error.interceptor';
import type { RequestState } from '../server-state/request-state';
import type { AppFile } from './app-file.model';
import type { FileCategory } from './file-category';
import { UploadService } from './upload.service';
import type { UploadedFileMetadata } from './uploaded-file-metadata.model';

describe('UploadService', () => {
  let service: UploadService;
  let httpMock: HttpTestingController;

  const mockFile = new File(['dummy-content'], 'report.pdf', { type: 'application/pdf' });
  const mockAppFile: AppFile = {
    file: mockFile,
    category: 'DOCUMENT' as FileCategory,
    subjectId: 'subj-001',
  };
  const UPLOAD_URL = 'http://api.test/api/v1/files/upload';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UploadService,
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: APP_BASE_URL, useValue: 'http://api.test' },
      ],
    });
    service = TestBed.inject(UploadService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should emit loadingState then successState on 2xx', () => {
    const states: RequestState<UploadedFileMetadata>[] = [];
    service.upload(mockAppFile).subscribe(s => states.push(s));

    const req = httpMock.expectOne(UPLOAD_URL);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'f-1', category: 'DOCUMENT' });

    expect(states[0].status).toBe('loading');
    expect(states[1].status).toBe('success');
    expect(states[1].data?.id).toBe('f-1');
  });

  it('should POST FormData to /api/v1/files/upload', () => {
    service.upload(mockAppFile).subscribe();
    const req = httpMock.expectOne(UPLOAD_URL);
    expect(req.request.body).toBeInstanceOf(FormData);
    req.flush({ id: 'f-1', category: 'DOCUMENT' });
  });

  it('should NOT set Content-Type header', () => {
    service.upload(mockAppFile).subscribe();
    const req = httpMock.expectOne(UPLOAD_URL);
    expect(req.request.headers.has('Content-Type')).toBeFalse();
    req.flush({ id: 'f-1', category: 'DOCUMENT' });
  });

  it('should append category to FormData', () => {
    service.upload(mockAppFile).subscribe();
    const req = httpMock.expectOne(UPLOAD_URL);
    expect((req.request.body as FormData).get('category')).toBe('DOCUMENT');
    req.flush({ id: 'f-1', category: 'DOCUMENT' });
  });

  it('should append subjectId to FormData when provided', () => {
    service.upload(mockAppFile).subscribe();
    const req = httpMock.expectOne(UPLOAD_URL);
    expect((req.request.body as FormData).get('subjectId')).toBe('subj-001');
    req.flush({ id: 'f-1', category: 'DOCUMENT' });
  });

  it('should omit subjectId from FormData when absent', () => {
    const appFile: AppFile = { file: mockFile, category: 'DOCUMENT' as FileCategory };
    service.upload(appFile).subscribe();
    const req = httpMock.expectOne(UPLOAD_URL);
    expect((req.request.body as FormData).has('subjectId')).toBeFalse();
    req.flush({ id: 'f-1', category: 'DOCUMENT' });
  });

  it('should map 413 to FileTooLarge error state', () => {
    const states: RequestState<UploadedFileMetadata>[] = [];
    service.upload(mockAppFile).subscribe(s => states.push(s));
    httpMock
      .expectOne(UPLOAD_URL)
      .flush('', { status: 413, statusText: 'Payload Too Large' });

    const last = states[states.length - 1];
    expect(last.status).toBe('error');
    expect(last.error?.code).toBe('FileTooLarge');
  });

  it('should map 415 to UnsupportedType error state', () => {
    const states: RequestState<UploadedFileMetadata>[] = [];
    service.upload(mockAppFile).subscribe(s => states.push(s));
    httpMock
      .expectOne(UPLOAD_URL)
      .flush('', { status: 415, statusText: 'Unsupported Media Type' });

    const last = states[states.length - 1];
    expect(last.status).toBe('error');
    expect(last.error?.code).toBe('UnsupportedType');
  });

  it('should map 401 to Unauthorized error state', () => {
    const states: RequestState<UploadedFileMetadata>[] = [];
    service.upload(mockAppFile).subscribe(s => states.push(s));
    httpMock
      .expectOne(UPLOAD_URL)
      .flush('', { status: 401, statusText: 'Unauthorized' });

    const last = states[states.length - 1];
    expect(last.status).toBe('error');
    expect(last.error?.code).toBe('Unauthorized');
  });
});
