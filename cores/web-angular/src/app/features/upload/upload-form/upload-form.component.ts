import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subscription } from 'rxjs';
import { EnistereErrorStateComponent } from '../../../shared/components/error-state/enistere-error-state.component';
import { EnistereLoadingStateComponent } from '../../../shared/components/loading-state/enistere-loading-state.component';
import { EnistereSuccessStateComponent } from '../../../shared/components/success-state/enistere-success-state.component';
import { getFieldError } from '../../../core/forms/form-error.utils';
import { idleState, type RequestState } from '../../../core/server-state/request-state';
import { FILE_CATEGORIES, type FileCategory } from '../../../core/upload/file-category';
import { UploadService } from '../../../core/upload/upload.service';
import type { UploadedFileMetadata } from '../../../core/upload/uploaded-file-metadata.model';

@Component({
  selector: 'app-upload-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    EnistereLoadingStateComponent,
    EnistereErrorStateComponent,
    EnistereSuccessStateComponent,
  ],
  templateUrl: './upload-form.component.html',
  styleUrl: './upload-form.component.scss',
})
export class UploadFormComponent implements OnDestroy {
  protected readonly getFieldError = getFieldError;
  protected readonly fileCategories = FILE_CATEGORIES;

  private readonly uploadService = inject(UploadService);
  private readonly fb = inject(FormBuilder);
  private sub?: Subscription;

  readonly uploadForm = this.fb.nonNullable.group({
    category: ['', [Validators.required]],
    subjectId: ['', [Validators.maxLength(128)]],
  });

  protected selectedFile = signal<File | null>(null);
  protected readonly state = signal<RequestState<UploadedFileMetadata>>(idleState());

  protected readonly errorMessage = computed(() => {
    const s = this.state();
    if (s.status !== 'error' || !s.error) return 'Une erreur est survenue. Veuillez réessayer.';
    switch (s.error.code) {
      case 'FileTooLarge':   return 'Le fichier dépasse la taille autorisée.';
      case 'UnsupportedType': return 'Type de fichier non supporté.';
      case 'Unauthorized':   return 'Session expirée — veuillez vous reconnecter.';
      case 'RateLimited':    return 'Trop de requêtes — veuillez patienter.';
      default:               return 'Une erreur est survenue. Veuillez réessayer.';
    }
  });

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
  }

  protected isFormReady(): boolean {
    return this.uploadForm.valid && this.selectedFile() !== null;
  }

  submit(): void {
    if (!this.isFormReady() || this.state().status === 'loading') return;

    const file = this.selectedFile()!;
    const { category, subjectId } = this.uploadForm.getRawValue();

    this.sub?.unsubscribe();
    this.sub = this.uploadService
      .upload({ file, category: category as FileCategory, subjectId: subjectId || undefined })
      .subscribe(s => this.state.set(s));
  }

  reset(): void {
    this.sub?.unsubscribe();
    this.state.set(idleState());
    this.selectedFile.set(null);
    this.uploadForm.reset();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
