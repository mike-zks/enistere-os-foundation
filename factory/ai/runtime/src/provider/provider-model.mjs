/**
 * Factory AI provider seam model.
 *
 * Pure Node module. No real provider, no network, no dependency.
 */

export const PROVIDER_ERROR_CODES = Object.freeze([
  'invalid_request',
  'provider_unavailable',
  'provider_rejected',
]);

export class AiProviderError extends Error {
  constructor(code, operation, message = code) {
    super(message);
    this.name = 'AiProviderError';
    this.code = PROVIDER_ERROR_CODES.includes(code) ? code : 'provider_rejected';
    this.operation = operation;
  }
}

export function createProviderCapabilities(overrides = {}) {
  return Object.freeze({
    providerId: 'fake',
    models: ['fake-deterministic-v1'],
    supportsComplete: true,
    supportsStream: false,
    supportsEmbed: false,
    maxInputChars: 12000,
    maxOutputChars: 4000,
    ...overrides,
  });
}

function isNonEmptyString(value, maxLength = 12000) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function isStringArray(value, maxItems = 20, maxLength = 200) {
  return Array.isArray(value) &&
    value.length <= maxItems &&
    value.every((item) => isNonEmptyString(item, maxLength));
}

export function validateCompletionRequest(request, capabilities = createProviderCapabilities()) {
  const issues = [];

  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    return [{ path: '$', message: 'request must be an object' }];
  }

  if (!isNonEmptyString(request.promptId, 80)) {
    issues.push({ path: 'promptId', message: 'promptId is required' });
  }

  if (!isNonEmptyString(request.promptVersion, 32)) {
    issues.push({ path: 'promptVersion', message: 'promptVersion is required' });
  }

  if (!isNonEmptyString(request.role, 80)) {
    issues.push({ path: 'role', message: 'role is required' });
  }

  if (!isNonEmptyString(request.input, capabilities.maxInputChars)) {
    issues.push({ path: 'input', message: `input is required and must be <= ${capabilities.maxInputChars} chars` });
  }

  if (request.context !== undefined && !isNonEmptyString(request.context, capabilities.maxInputChars)) {
    issues.push({ path: 'context', message: `context must be <= ${capabilities.maxInputChars} chars when provided` });
  }

  if (request.allowedFiles !== undefined && !isStringArray(request.allowedFiles)) {
    issues.push({ path: 'allowedFiles', message: 'allowedFiles must be a bounded string array' });
  }

  if (request.forbiddenFiles !== undefined && !isStringArray(request.forbiddenFiles)) {
    issues.push({ path: 'forbiddenFiles', message: 'forbiddenFiles must be a bounded string array' });
  }

  return issues;
}

export function describeProviderForLog(capabilities) {
  return {
    providerId: capabilities.providerId,
    models: capabilities.models,
    supportsComplete: capabilities.supportsComplete,
    supportsStream: capabilities.supportsStream,
    supportsEmbed: capabilities.supportsEmbed,
  };
}
