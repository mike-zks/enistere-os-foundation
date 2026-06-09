/**
 * Normalisation des résultats `openapi-fetch` en `ApiClientError` (ou succès).
 * Une erreur réseau/timeout n'est JAMAIS muée en fausse 5xx (gérée en amont par le transport).
 */
import { ApiClientError } from './api-client-error.js';

export interface NormalizableResult {
  data?: unknown;
  error?: unknown;
  response: Response;
}

export function readRequestId(response: Response): string | null {
  return response.headers.get('x-request-id');
}

/** Retourne une `ApiClientError` si le résultat HTTP est en échec, sinon `null`. */
export function toApiClientError(result: NormalizableResult): ApiClientError | null {
  if (result.error !== undefined && result.error !== null) {
    return ApiClientError.fromHttp(result.response.status, result.error, readRequestId(result.response));
  }
  if (!result.response.ok) {
    return ApiClientError.fromHttp(result.response.status, undefined, readRequestId(result.response));
  }
  return null;
}
