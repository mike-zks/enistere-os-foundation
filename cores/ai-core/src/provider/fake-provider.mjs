/**
 * Deterministic fake AI provider.
 *
 * It never calls a network, never loads a model, and never stores prompts.
 */

import {
  AiProviderError,
  createProviderCapabilities,
  validateCompletionRequest,
} from './provider-model.mjs';

function hashText(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function summarize(text, maxLength = 180) {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  return oneLine.length <= maxLength ? oneLine : `${oneLine.slice(0, maxLength)}...`;
}

export function createFakeProvider(options = {}) {
  const capabilities = createProviderCapabilities({
    providerId: 'fake',
    models: ['fake-deterministic-v1'],
    maxInputChars: options.maxInputChars ?? 12000,
    maxOutputChars: options.maxOutputChars ?? 4000,
  });

  return {
    describeCapabilities() {
      return capabilities;
    },

    async complete(request) {
      const issues = validateCompletionRequest(request, capabilities);
      if (issues.length > 0) {
        throw new AiProviderError('invalid_request', 'complete', 'invalid completion request');
      }

      const context = typeof request.context === 'string' ? request.context : '';
      const fingerprint = hashText(`${request.promptId}|${request.promptVersion}|${request.role}|${request.input}|${context}`);
      const output = [
        `Fake completion for ${request.promptId}@${request.promptVersion}`,
        `role=${request.role}`,
        `fingerprint=${fingerprint}`,
        `input=${summarize(request.input)}`,
        context ? `context=${summarize(context)}` : 'context=none',
      ].join('\n');

      return {
        providerId: capabilities.providerId,
        model: capabilities.models[0],
        output: output.slice(0, capabilities.maxOutputChars),
        usage: {
          inputChars: request.input.length + context.length,
          outputChars: Math.min(output.length, capabilities.maxOutputChars),
        },
        metadata: {
          deterministic: true,
        },
      };
    },
  };
}
