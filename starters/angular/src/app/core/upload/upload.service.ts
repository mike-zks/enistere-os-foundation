import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_BASE_URL } from '../config/api-config';
import { createRequestState, type RequestState } from '../server-state/request-state';
import type { AppFile } from './app-file.model';
import type { UploadedFileMetadata } from './uploaded-file-metadata.model';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(APP_BASE_URL);

  upload(appFile: AppFile): Observable<RequestState<UploadedFileMetadata>> {
    const body = new FormData();
    body.append('file', appFile.file);
    body.append('category', appFile.category);
    if (appFile.subjectId) {
      body.append('subjectId', appFile.subjectId);
    }
    // Content-Type intentionally omitted — browser sets multipart/form-data boundary automatically
    return createRequestState(
      this.http.post<UploadedFileMetadata>(`${this.baseUrl}/api/v1/files/upload`, body),
    );
  }
}
