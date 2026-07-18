import { scrubString } from './sensitive-fields';

export interface SerializedError {
  errorType: string;
  errorCode?: string;
  message: string;
  stack?: string;
  cause?: { errorType: string; message: string } | string;
}

interface ErrorLike {
  name?: unknown;
  message?: unknown;
  stack?: unknown;
  code?: unknown;
  cause?: unknown;
  getResponse?: () => unknown;
}

/**
 * Sérialiseur d'erreur **par liste blanche** (ADR-040) : n'expose QUE `errorType`, `errorCode`,
 * `message`, `stack`, `cause`. Ne sérialise JAMAIS l'objet externe complet (Prisma/AWS/SDK) — leurs
 * `config`/credentials/requête brute ne sont donc jamais journalisés. Les textes libres
 * (`message`/`stack`/`cause`) sont en plus nettoyés (`scrubString`) des chaînes de connexion,
 * paramètres d'URL signée et jetons bearer. La `stack` ne va QUE dans les logs techniques.
 */
export function serializeError(error: unknown): SerializedError {
  if (!(error instanceof Error)) {
    return { errorType: typeof error, message: scrubString(String(error)) };
  }

  const candidate = error as ErrorLike;
  const serialized: SerializedError = {
    errorType: error.name,
    message: scrubString(error.message),
  };

  // errorCode : code applicatif générique (HttpException `{ code }` ou `err.code`).
  let code: string | undefined;
  if (typeof candidate.code === 'string') {
    code = candidate.code;
  }
  if (typeof candidate.getResponse === 'function') {
    const response = candidate.getResponse();
    if (response !== null && typeof response === 'object') {
      const payloadCode = (response as { code?: unknown }).code;
      if (typeof payloadCode === 'string') {
        code = payloadCode;
      }
    }
  }
  if (code) {
    serialized.errorCode = code;
  }

  if (typeof error.stack === 'string') {
    serialized.stack = scrubString(error.stack);
  }

  const cause = candidate.cause;
  if (cause instanceof Error) {
    serialized.cause = { errorType: cause.name, message: scrubString(cause.message) };
  } else if (typeof cause === 'string') {
    serialized.cause = scrubString(cause);
  } else if (typeof cause === 'number' || typeof cause === 'boolean' || typeof cause === 'bigint') {
    serialized.cause = String(cause);
  }
  // Une `cause` objet non-Error n'est pas stringifiée (évite toute fuite de structure inconnue).

  return serialized;
}
