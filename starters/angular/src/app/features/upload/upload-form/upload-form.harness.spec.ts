import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatProgressSpinnerHarness } from '@angular/material/progress-spinner/testing';
import { APP_BASE_URL } from '../../../core/config/api-config';
import { loadingState, successState } from '../../../core/server-state/request-state';
import { FILE_CATEGORIES } from '../../../core/upload/file-category';
import type { FileCategory } from '../../../core/upload/file-category';
import type { UploadedFileMetadata } from '../../../core/upload/uploaded-file-metadata.model';
import { UploadService } from '../../../core/upload/upload.service';
import { UploadFormComponent } from './upload-form.component';

describe('UploadFormComponent CDK harnesses', () => {
  let fixture: ComponentFixture<UploadFormComponent>;
  let loader: HarnessLoader;

  const successData: UploadedFileMetadata = { id: 'f-1', category: 'DOCUMENT' as FileCategory };

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
    spyOn(TestBed.inject(UploadService), 'upload').and.returnValue(of(successState(successData)));
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('MatSelect has an option for each file category', async () => {
    const select = await loader.getHarness(MatSelectHarness);
    await select.open();
    const options = await select.getOptions();
    expect(options.length).toBe(FILE_CATEGORIES.length);
    await select.close();
  });

  it('MatSelect options include "Document" and "Image" labels', async () => {
    const select = await loader.getHarness(MatSelectHarness);
    await select.open();
    const options = await select.getOptions();
    const texts = await Promise.all(options.map((o) => o.getText()));
    expect(texts).toContain('Document');
    expect(texts).toContain('Image');
    await select.close();
  });

  it('submit MatButton has text "Envoyer"', async () => {
    const btn = await loader.getHarness(MatButtonHarness.with({ text: 'Envoyer' }));
    expect(btn).toBeTruthy();
  });

  it('MatProgressSpinnerHarness is present during loading state', async () => {
    (fixture.componentInstance as any).state.set(loadingState());
    fixture.detectChanges();
    const spinner = await loader.getHarness(MatProgressSpinnerHarness);
    expect(spinner).toBeTruthy();
  });
});
