/**
 * Façade fichiers typée. Upload multipart (Web/RN) ; metadata ; URL signée ; suppression 204 ;
 * quarantaine/restauration. L'upload rejoue au plus une fois après refresh en RECONSTRUISANT le
 * FormData depuis la source re-lisible (jamais de rejeu d'un corps consommé).
 */
import type { SchemaOf } from '@enistere/api-contracts';

import { ApiClientError } from '../errors/api-client-error.js';
import { toApiClientError } from '../errors/error-normalizer.js';
import { buildUploadFormData, type UploadFilePart } from '../multipart/upload-form-data.js';
import type { FileCategory } from '../multipart/web-form-data.js';
import type { Transport } from './transport.js';

export interface UploadOptions {
  subjectId?: string;
  /** Rejeu unique après refresh (défaut true ; le FormData est reconstruit depuis la source). */
  retryOnAuthRefresh?: boolean;
}

export class FilesApi {
  constructor(private readonly t: Transport) {}

  async upload(
    part: UploadFilePart,
    category: FileCategory,
    options?: UploadOptions,
  ): Promise<SchemaOf<'PublicStoredFileDto'>> {
    const retry = options?.retryOnAuthRefresh ?? true;
    const send = (signal: AbortSignal) =>
      this.t.raw.POST('/files', {
        // Multipart : on passe un FormData (assertion unique ; openapi-fetch ne force pas le Content-Type).
        body: buildUploadFormData(part, category, options?.subjectId) as never,
        signal,
      });

    let result = await this.t.invoke(send);
    if (result.response.status === 401 && this.t.refreshEnabled && retry) {
      const refreshed = await this.t.coordinateRefresh();
      if (!refreshed) {
        throw ApiClientError.sessionExpired(this.t.requestId(result.response));
      }
      result = await this.t.invoke(send); // rejeu UNIQUE, FormData reconstruit depuis `part`
    }
    const error = toApiClientError(result);
    if (error) {
      throw error;
    }
    if (result.data === undefined) {
      throw ApiClientError.fromHttp(result.response.status, undefined, this.t.requestId(result.response));
    }
    return result.data.data;
  }

  async list(params?: { limit?: number; offset?: number }): Promise<SchemaOf<'FileListResponseDto'>> {
    const result = await this.t.invokeRefreshable((signal) =>
      this.t.raw.GET('/files', { params: { query: params }, signal }),
    );
    const error = toApiClientError(result);
    if (error) {
      throw error;
    }
    if (result.data === undefined) {
      throw ApiClientError.fromHttp(result.response.status, undefined, this.t.requestId(result.response));
    }
    return result.data.data;
  }

  async getMetadata(id: string): Promise<SchemaOf<'PublicStoredFileDto'>> {
    const result = await this.t.invokeRefreshable((signal) =>
      this.t.raw.GET('/files/{id}', { params: { path: { id } }, signal }),
    );
    const error = toApiClientError(result);
    if (error) {
      throw error;
    }
    if (result.data === undefined) {
      throw ApiClientError.fromHttp(result.response.status, undefined, this.t.requestId(result.response));
    }
    return result.data.data;
  }

  async createDownloadUrl(id: string): Promise<SchemaOf<'SignedDownloadResponseDto'>> {
    const result = await this.t.invokeRefreshable((signal) =>
      this.t.raw.POST('/files/{id}/download-url', { params: { path: { id } }, signal }),
    );
    const error = toApiClientError(result);
    if (error) {
      throw error;
    }
    if (result.data === undefined) {
      throw ApiClientError.fromHttp(result.response.status, undefined, this.t.requestId(result.response));
    }
    return result.data.data;
  }

  /** Suppression idempotente (204 No Content) : aucun corps à parser. */
  async delete(id: string): Promise<void> {
    const result = await this.t.invokeRefreshable((signal) =>
      this.t.raw.DELETE('/files/{id}', { params: { path: { id } }, signal }),
    );
    const error = toApiClientError(result);
    if (error) {
      throw error;
    }
  }

  /** Quarantaine administrative (réponse sans corps métier). */
  async quarantine(id: string): Promise<void> {
    const result = await this.t.invokeRefreshable((signal) =>
      this.t.raw.POST('/files/{id}/quarantine', {
        params: { path: { id } },
        body: {} as Record<string, never>,
        signal,
      }),
    );
    const error = toApiClientError(result);
    if (error) {
      throw error;
    }
  }

  /** Restauration administrative (réponse sans corps métier). */
  async restore(id: string): Promise<void> {
    const result = await this.t.invokeRefreshable((signal) =>
      this.t.raw.POST('/files/{id}/restore', { params: { path: { id } }, signal }),
    );
    const error = toApiClientError(result);
    if (error) {
      throw error;
    }
  }
}
