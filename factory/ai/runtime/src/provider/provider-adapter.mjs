/**
 * Provider adapter helpers.
 *
 * Wraps provider calls with request validation and redaction. No real provider,
 * no network and no dependency are introduced here.
 */

import { redactText, redactValue } from '../redaction/index.mjs';
import {
  AiProviderError,
  validateCompletionRequest,
} from './provider-model.mjs';

function redactCompletionRequest(request) {
  const valueResult = redactValue({
    ...request,
    input: undefined,
    context: undefined,
  });
  const inputResult = redactText(request.input);
  const contextResult = typeof request.context === 'string'
    ? redactText(request.context)
    : { safeText: undefined, redactedKinds: [], warnings: [], truncated: false };

  return {
    request: {
      ...valueResult.safeValue,
      input: inputResult.safeText,
      ...(contextResult.safeText === undefined ? {} : { context: contextResult.safeText }),
    },
    redactedKinds: [
      ...valueResult.redactedKinds,
      ...inputResult.redactedKinds,
      ...contextResult.redactedKinds,
    ],
    warnings: [
      ...valueResult.warnings,
      ...inputResult.warnings,
      ...contextResult.warnings,
    ],
    truncated: valueResult.truncated || inputResult.truncated || contextResult.truncated,
  };
}

function unique(values) {
  return [...new Set(values)];
}

export function createSafeProviderAdapter(provider) {
  if (!provider || typeof provider.complete !== 'function' || typeof provider.describeCapabilities !== 'function') {
    throw new TypeError('provider must implement complete() and describeCapabilities()');
  }

  return {
    describeCapabilities() {
      return provider.describeCapabilities();
    },

    async complete(request) {
      const capabilities = provider.describeCapabilities();
      const issues = validateCompletionRequest(request, capabilities);
      if (issues.length > 0) {
        throw new AiProviderError('invalid_request', 'complete', 'invalid completion request');
      }

      const redacted = redactCompletionRequest(request);
      const response = await provider.complete(redacted.request);

      return {
        ...response,
        safety: {
          redactedKinds: unique(redacted.redactedKinds),
          warnings: unique(redacted.warnings),
          truncated: redacted.truncated,
        },
      };
    },
  };
}
