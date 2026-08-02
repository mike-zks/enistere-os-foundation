import { Injectable, computed, inject, signal } from '@angular/core';
import { isAppApiError } from '../../core/errors/app-api-error';
import { AuthService } from '../auth/auth.service';
import { currentContextAllowsInsecure, triggerDownload } from './download';
import { isUuid, validateUpload, type UploadValidation } from './file-validation';
import { FilesApi } from './files-api';
import type { FilePage, PublicFilesError } from './files-models';

type FilesState =
  | { readonly status: 'idle' | 'loading'; readonly page: null; readonly error: null }
  | { readonly status: 'ready'; readonly page: FilePage; readonly error: null }
  | { readonly status: 'error'; readonly page: null; readonly error: PublicFilesError };

interface SessionState { readonly ownerId: string | null; readonly value: FilesState }
const IDLE: FilesState = { status: 'idle', page: null, error: null };

/** Session-scoped public metadata. Local Files and signed URLs never enter state. */
@Injectable({ providedIn: 'root' })
export class FilesService {
  readonly #api = inject(FilesApi);
  readonly #auth = inject(AuthService);
  readonly #stored = signal<SessionState>({ ownerId: null, value: IDLE });

  readonly state = computed<FilesState>(() => {
    const ownerId = this.#auth.snapshot().user?.id ?? null;
    return this.#stored().ownerId === ownerId ? this.#stored().value : IDLE;
  });

  async load(offset = 0, limit = 20): Promise<void> {
    const ownerId = this.#auth.snapshot().user?.id ?? null;
    if (!ownerId) {
      this.#stored.set({ ownerId: null, value: IDLE });
      return;
    }
    this.#stored.set({ ownerId, value: { status: 'loading', page: null, error: null } });
    try {
      const page = await this.#api.list(limit, offset);
      if (this.#auth.snapshot().user?.id === ownerId) {
        this.#stored.set({ ownerId, value: { status: 'ready', page, error: null } });
      }
    } catch (error: unknown) {
      this.#fail(ownerId, error);
    }
  }

  validate(file: File | null, category: string, subjectId: string): UploadValidation {
    return validateUpload(file, category, subjectId);
  }

  async upload(file: File | null, category: string, subjectId: string): Promise<boolean> {
    const validation = validateUpload(file, category, subjectId);
    if (!validation.valid || !this.#auth.snapshot().user) return false;
    await this.#api.upload(validation.command);
    await this.load();
    return true;
  }

  async download(id: string): Promise<boolean> {
    if (!isUuid(id) || !this.#auth.snapshot().user) return false;
    const signed = await this.#api.issueDownloadUrl(id);
    return triggerDownload(signed.url, currentContextAllowsInsecure());
  }

  async delete(id: string): Promise<boolean> {
    return this.#mutate(id, () => this.#api.delete(id));
  }

  async quarantine(id: string): Promise<boolean> {
    return this.#mutate(id, () => this.#api.quarantine(id));
  }

  async restore(id: string): Promise<boolean> {
    return this.#mutate(id, () => this.#api.restore(id));
  }

  async #mutate(id: string, operation: () => Promise<void>): Promise<boolean> {
    if (!isUuid(id) || !this.#auth.snapshot().user) return false;
    await operation();
    await this.load();
    return true;
  }

  #fail(ownerId: string, error: unknown): void {
    if (this.#auth.snapshot().user?.id !== ownerId) return;
    this.#stored.set({
      ownerId,
      value: { status: 'error', page: null, error: publicError(error) },
    });
  }
}

function publicError(error: unknown): PublicFilesError {
  if (!isAppApiError(error)) return { kind: 'error', requestId: null };
  const kinds: Record<string, PublicFilesError['kind']> = {
    Unauthorized: 'unauthorized', Forbidden: 'forbidden', NotFound: 'notfound',
    Conflict: 'conflict', FileTooLarge: 'too-large', UnsupportedType: 'unsupported',
    RateLimited: 'rate-limited', NetworkError: 'unavailable', ServerError: 'unavailable',
  };
  return { kind: kinds[error.code] ?? 'error', requestId: error.requestId };
}
