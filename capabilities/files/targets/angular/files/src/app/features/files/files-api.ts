import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { APP_BASE_URL } from '../../core/config/api-config';
import type { FilePage, PublicStoredFile, SignedDownload, UploadCommand } from './files-models';

interface SuccessEnvelope<T> { readonly success: true; readonly data: T; readonly timestamp: string }
type AuthorityResponse<T> = T | SuccessEnvelope<T>;

function unwrap<T>(response: AuthorityResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'success' in response && 'data' in response) {
    return response.data;
  }
  return response;
}

/** Stateless transport. Auth is attached by the existing in-memory bearer interceptor. */
@Injectable({ providedIn: 'root' })
export class FilesApi {
  readonly #http = inject(HttpClient);
  readonly #root = `${inject(APP_BASE_URL)}/api/v1/files`;

  list(limit: number, offset: number): Promise<FilePage> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return firstValueFrom(this.#http.get<AuthorityResponse<FilePage>>(this.#root, { params }))
      .then(unwrap);
  }

  upload(command: UploadCommand): Promise<PublicStoredFile> {
    const body = new FormData();
    body.append('file', command.file);
    body.append('category', command.category);
    if (command.subjectId) body.append('subjectId', command.subjectId);
    return firstValueFrom(this.#http.post<AuthorityResponse<PublicStoredFile>>(`${this.#root}/upload`, body))
      .then(unwrap);
  }

  issueDownloadUrl(id: string): Promise<SignedDownload> {
    return firstValueFrom(this.#http.post<AuthorityResponse<SignedDownload>>(
      `${this.#root}/${encodeURIComponent(id)}/download-url`, {},
    )).then(unwrap);
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(this.#http.delete<void>(`${this.#root}/${encodeURIComponent(id)}`));
  }

  quarantine(id: string): Promise<void> {
    return firstValueFrom(this.#http.post<void>(`${this.#root}/${encodeURIComponent(id)}/quarantine`, {}));
  }

  restore(id: string): Promise<void> {
    return firstValueFrom(this.#http.post<void>(`${this.#root}/${encodeURIComponent(id)}/restore`, {}));
  }
}
