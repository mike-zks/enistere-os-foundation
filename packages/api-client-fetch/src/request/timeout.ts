/**
 * Timeout par requête via `AbortController`, combinable avec un signal d'annulation utilisateur.
 *
 * Le délai est garanti même si l'opération sous-jacente n'observe pas le signal (course explicite).
 * Distingue : timeout (`ApiClientError` 'timeout'), erreur réseau ('network'), et annulation EXPLICITE
 * de l'appelant (re-levée telle quelle, jamais masquée en timeout). Le signal combiné est tout de même
 * transmis à `fn` pour qu'un `fetch` réel libère ses ressources à l'abandon.
 */
import { ApiClientError } from '../errors/api-client-error.js';

export async function withTimeout<R>(
  fn: (signal: AbortSignal) => Promise<R>,
  timeoutMs: number,
  externalSignal?: AbortSignal,
): Promise<R> {
  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), timeoutMs);
  const signal = externalSignal
    ? AbortSignal.any([timeoutController.signal, externalSignal])
    : timeoutController.signal;
  try {
    return await new Promise<R>((resolve, reject) => {
      const onAbort = (): void => {
        if (externalSignal?.aborted) {
          // Annulation demandée par l'appelant : on la propage telle quelle.
          reject(externalSignal.reason instanceof Error ? externalSignal.reason : new Error('Request cancelled.'));
        } else {
          reject(ApiClientError.timeout(null));
        }
      };
      if (signal.aborted) {
        onAbort();
      } else {
        signal.addEventListener('abort', onAbort, { once: true });
      }
      fn(signal).then(resolve, reject);
    });
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    if (externalSignal?.aborted) {
      throw error;
    }
    if (timeoutController.signal.aborted) {
      throw ApiClientError.timeout(null);
    }
    throw ApiClientError.network('Network request failed.', null, error);
  } finally {
    clearTimeout(timer);
  }
}
