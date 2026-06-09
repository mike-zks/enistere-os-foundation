/**
 * Erreur normalisée de la couche cliente Enistere.
 *
 * Construite à partir de `ApiErrorResponse` (contrat canonique). Ne conserve QUE des champs non
 * sensibles : jamais de token, jamais d'en-tête Authorization, jamais d'URL signée, jamais de body de
 * fichier, jamais la réponse brute complète. La logique applicative s'appuie sur `kind`/`status`/
 * `errorCode`, jamais sur `message` (générique).
 */
import type { ApiErrorResponse } from '@enistere/api-contracts';

export type ApiClientErrorKind =
  | 'http' // réponse HTTP non-2xx typée (corps ApiErrorResponse)
  | 'network' // échec réseau (DNS, connexion, fetch rejeté)
  | 'timeout' // délai dépassé (AbortController)
  | 'invalid_response' // réponse illisible / corps inattendu
  | 'session_expired'; // refresh impossible → session nettoyée

export interface ApiClientErrorInit {
  kind: ApiClientErrorKind;
  message: string;
  status?: number | null;
  errorCode?: string | null;
  details?: unknown;
  requestId?: string | null;
  cause?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Garde de type : un corps correspond-il à `ApiErrorResponse` (`ApiErrorResponseDto`) ? */
export function isApiErrorBody(value: unknown): value is ApiErrorResponse {
  return (
    isRecord(value) &&
    value['success'] === false &&
    typeof value['statusCode'] === 'number' &&
    typeof value['message'] === 'string' &&
    typeof value['errorCode'] === 'string'
  );
}

export class ApiClientError extends Error {
  readonly kind: ApiClientErrorKind;
  readonly status: number | null;
  readonly errorCode: string | null;
  readonly details: unknown;
  readonly requestId: string | null;

  constructor(init: ApiClientErrorInit) {
    // `cause` contrôlée : on ne propage qu'une cause primitive/erreur, jamais un objet réseau riche.
    super(init.message, init.cause === undefined ? undefined : { cause: init.cause });
    this.name = 'ApiClientError';
    this.kind = init.kind;
    this.status = init.status ?? null;
    this.errorCode = init.errorCode ?? null;
    this.details = init.details;
    this.requestId = init.requestId ?? null;
  }

  static fromHttp(status: number, body: unknown, headerRequestId: string | null): ApiClientError {
    if (isApiErrorBody(body)) {
      return new ApiClientError({
        kind: 'http',
        message: body.message,
        status,
        errorCode: body.errorCode,
        details: body.details,
        requestId: body.requestId ?? headerRequestId,
      });
    }
    return new ApiClientError({
      kind: 'invalid_response',
      message: `Unexpected error response (status ${status}).`,
      status,
      requestId: headerRequestId,
    });
  }

  static network(message: string, requestId: string | null, cause?: unknown): ApiClientError {
    return new ApiClientError({ kind: 'network', message, requestId, cause });
  }

  static timeout(requestId: string | null): ApiClientError {
    return new ApiClientError({ kind: 'timeout', message: 'Request timed out.', requestId });
  }

  static sessionExpired(requestId: string | null, cause?: unknown): ApiClientError {
    return new ApiClientError({ kind: 'session_expired', message: 'Session expired.', requestId, cause });
  }

  /** 401 — non authentifié. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** 403 — authentifié mais non autorisé. JAMAIS de refresh sur ce cas. */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** 404 — introuvable (anti-énumération côté API). */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** 409 — conflit (transition de statut / quota). */
  get isConflict(): boolean {
    return this.status === 409;
  }

  /** 429 — trop de requêtes (rate limit). */
  get isRateLimited(): boolean {
    return this.status === 429;
  }
}
