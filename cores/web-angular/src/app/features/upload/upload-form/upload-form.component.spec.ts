import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { APP_BASE_URL } from '../../../core/config/api-config';
import {
  errorState,
  loadingState,
  successState,
  type RequestState,
} from '../../../core/server-state/request-state';
import { UploadService } from '../../../core/upload/upload.service';
import type { FileCategory } from '../../../core/upload/file-category';
import type { UploadedFileMetadata } from '../../../core/upload/uploaded-file-metadata.model';
import { UploadFormComponent } from './upload-form.component';

describe('UploadFormComponent', () => {
  let fixture: ComponentFixture<UploadFormComponent>;
  let compiled: HTMLElement;
  let uploadSpy: jasmine.Spy;

  const mockFile = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
  const successData: UploadedFileMetadata = { id: 'f-1', category: 'DOCUMENT' as FileCategory };

  function setState(s: RequestState<UploadedFileMetadata>): void {
    (fixture.componentInstance as any).state.set(s);
    fixture.detectChanges();
  }

  function setFile(file: File | null): void {
    (fixture.componentInstance as any).onFileChange({
      target: { files: file ? [file] : [] },
    } as unknown as Event);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadFormComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        { provide: APP_BASE_URL, useValue: '' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadFormComponent);
    uploadSpy = spyOn(TestBed.inject(UploadService), 'upload').and.returnValue(
      of(successState(successData)),
    );
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;
  });

  it('should create the component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the form in idle state', () => {
    expect(compiled.querySelector('form.upload-form')).toBeTruthy();
    expect(compiled.querySelector('enistere-loading-state')).toBeNull();
    expect(compiled.querySelector('enistere-success-state')).toBeNull();
    expect(compiled.querySelector('enistere-error-state')).toBeNull();
  });

  it('should have the file input and category select', () => {
    expect(compiled.querySelector('input#file-input[type="file"]')).toBeTruthy();
    expect(compiled.querySelector('mat-select')).toBeTruthy();
  });

  it('should disable submit when no file is selected', () => {
    fixture.componentInstance.uploadForm.controls.category.setValue('DOCUMENT');
    fixture.detectChanges();
    const btn = compiled.querySelector<HTMLButtonElement>('button[type="submit"]');
    expect(btn?.disabled).toBeTrue();
  });

  it('should disable submit when no category is selected', () => {
    setFile(mockFile);
    const btn = compiled.querySelector<HTMLButtonElement>('button[type="submit"]');
    expect(btn?.disabled).toBeTrue();
  });

  it('should enable submit when file and category are both provided', () => {
    setFile(mockFile);
    fixture.componentInstance.uploadForm.controls.category.setValue('DOCUMENT');
    fixture.detectChanges();
    const btn = compiled.querySelector<HTMLButtonElement>('button[type="submit"]');
    expect(btn?.disabled).toBeFalse();
  });

  it('should call UploadService.upload with file and category on submit', () => {
    setFile(mockFile);
    fixture.componentInstance.uploadForm.controls.category.setValue('DOCUMENT');
    fixture.detectChanges();
    compiled.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    expect(uploadSpy).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({ file: mockFile, category: 'DOCUMENT' }),
    );
  });

  it('should reject oversized files before calling UploadService', () => {
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.pdf', {
      type: 'application/pdf',
    });
    setFile(big);
    fixture.componentInstance.uploadForm.controls.category.setValue('DOCUMENT');
    fixture.detectChanges();

    compiled.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();

    expect(uploadSpy).not.toHaveBeenCalled();
    expect(compiled.textContent).toContain('Le fichier dépasse la taille autorisée.');
  });

  it('should reject unsupported MIME types before calling UploadService', () => {
    const executable = new File(['x'], 'run.exe', { type: 'application/x-executable' });
    setFile(executable);
    fixture.componentInstance.uploadForm.controls.category.setValue('DOCUMENT');
    fixture.detectChanges();

    compiled.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();

    expect(uploadSpy).not.toHaveBeenCalled();
    expect(compiled.textContent).toContain('Type de fichier non supporté.');
  });

  it('should show loading state during upload', () => {
    setState(loadingState());
    expect(compiled.querySelector('form.upload-form')).toBeNull();
    expect(compiled.querySelector('enistere-loading-state')).toBeTruthy();
  });

  it('should show success state after successful upload', () => {
    setState(successState(successData));
    expect(compiled.querySelector('form.upload-form')).toBeNull();
    expect(compiled.querySelector('enistere-success-state')).toBeTruthy();
  });

  it('should show FileTooLarge error message on 413', () => {
    setState(errorState({ code: 'FileTooLarge', statusCode: 413, requestId: null }));
    expect(compiled.querySelector('enistere-error-state')).toBeTruthy();
    expect(compiled.textContent).toContain('Le fichier dépasse la taille autorisée.');
  });

  it('should show UnsupportedType error message on 415', () => {
    setState(errorState({ code: 'UnsupportedType', statusCode: 415, requestId: null }));
    expect(compiled.querySelector('enistere-error-state')).toBeTruthy();
    expect(compiled.textContent).toContain('Type de fichier non supporté.');
  });

  it('should return to form after reset from error state', () => {
    setState(errorState({ code: 'FileTooLarge', statusCode: 413, requestId: null }));
    (fixture.componentInstance as any).reset();
    fixture.detectChanges();
    expect(compiled.querySelector('form.upload-form')).toBeTruthy();
    expect(compiled.querySelector('enistere-error-state')).toBeNull();
  });

  it('should return to form after reset from success state', () => {
    setState(successState(successData));
    (fixture.componentInstance as any).reset();
    fixture.detectChanges();
    expect(compiled.querySelector('form.upload-form')).toBeTruthy();
    expect(compiled.querySelector('enistere-success-state')).toBeNull();
  });

  it('should not expose filename in error state DOM', () => {
    const sensitiveFile = new File(['x'], 'personal-contract-2024.pdf', { type: 'application/pdf' });
    setFile(sensitiveFile);
    setState(errorState({ code: 'FileTooLarge', statusCode: 413, requestId: null }));
    expect(compiled.textContent).not.toContain('personal-contract-2024');
  });
});
