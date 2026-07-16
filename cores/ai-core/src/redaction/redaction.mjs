/**
 * AI Core Redaction Layer.
 *
 * Pure Node module. No provider, no network, no dependency.
 */

export const REDACTED = '[Redacted]';
export const TRUNCATED = '[Truncated]';
export const CIRCULAR = '[Circular]';

const MAX_DEPTH = 8;
const MAX_TEXT_LENGTH = 12000;

const SENSITIVE_KEYS = new Set([
  'authorization',
  'proxyauthorization',
  'cookie',
  'setcookie',
  'password',
  'passwordhash',
  'pwd',
  'pass',
  'otp',
  'pin',
  'token',
  'accesstoken',
  'refreshtoken',
  'idtoken',
  'sessiontoken',
  'tokenhash',
  'jwt',
  'bearer',
  'secret',
  'clientsecret',
  'apikey',
  'apisecret',
  'accesskey',
  'secretkey',
  'privatekey',
  'signedurl',
  'presignedurl',
  'signature',
  'credential',
  'credentials',
  'email',
  'emailaddress',
  'phone',
  'phonenumber',
  'creditcard',
  'cardnumber',
  'cvv',
  'cvc',
  'env',
  'dotenv',
]);

function normalizeKey(key) {
  return String(key).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function unique(values) {
  return [...new Set(values)];
}

function pushKind(kinds, kind) {
  kinds.push(kind);
}

function applyPattern(input, pattern, replacement, kinds, kind) {
  let matched = false;
  const out = input.replace(pattern, (...args) => {
    matched = true;
    return typeof replacement === 'function' ? replacement(...args) : replacement;
  });
  if (matched) {
    pushKind(kinds, kind);
  }
  return out;
}

export function isSensitiveKey(key) {
  const normalized = normalizeKey(key);
  return SENSITIVE_KEYS.has(normalized);
}

export function redactText(input) {
  const kinds = [];
  const warnings = [];
  let text = typeof input === 'string' ? input : String(input);
  let truncated = false;

  if (text.length > MAX_TEXT_LENGTH) {
    text = text.slice(0, MAX_TEXT_LENGTH);
    truncated = true;
    warnings.push('text_truncated');
  }

  text = applyPattern(
    text,
    /\b(file|content|ph|assets-library):\/\/\S*/gi,
    (_match, scheme) => `${scheme}://${REDACTED}`,
    kinds,
    'local_path',
  );

  text = applyPattern(
    text,
    /\bBearer\s+[\w.\-+/=]+/gi,
    `Bearer ${REDACTED}`,
    kinds,
    'authorization',
  );

  text = applyPattern(
    text,
    /\bBasic\s+[\w.\-+/=]+/gi,
    `Basic ${REDACTED}`,
    kinds,
    'authorization',
  );

  text = applyPattern(
    text,
    /\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{6,}\b/g,
    REDACTED,
    kinds,
    'jwt',
  );

  text = applyPattern(
    text,
    /([?&][^=&\s]*(?:token|signature|sig|secret|password|credential|key|code|auth)[^=&\s]*=)[^&#\s]*/gi,
    (_match, prefix) => `${prefix}${REDACTED}`,
    kinds,
    'signed_url_param',
  );

  text = applyPattern(
    text,
    /(^|\n)\s*([A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_KEY|PRIVATE_KEY|ACCESS_KEY|REFRESH)[A-Z0-9_]*)\s*=\s*[^\n]+/g,
    (_match, prefix, key) => `${prefix}${key}=${REDACTED}`,
    kinds,
    'env_secret',
  );

  text = applyPattern(
    text,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
    REDACTED,
    kinds,
    'private_key',
  );

  text = applyPattern(
    text,
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
    REDACTED,
    kinds,
    'email',
  );

  return {
    safeText: text,
    redactedKinds: unique(kinds),
    truncated,
    warnings,
  };
}

export function redactValue(value) {
  const context = {
    kinds: [],
    warnings: [],
    truncated: false,
  };

  const safeValue = redactInternal(value, 0, new WeakSet(), context);

  return {
    safeValue,
    redactedKinds: unique(context.kinds),
    truncated: context.truncated,
    warnings: unique(context.warnings),
  };
}

function redactInternal(value, depth, seen, context) {
  if (value === null || value === undefined) {
    return value;
  }

  switch (typeof value) {
    case 'string': {
      const result = redactText(value);
      context.kinds.push(...result.redactedKinds);
      context.warnings.push(...result.warnings);
      context.truncated ||= result.truncated;
      return result.safeText;
    }
    case 'number':
    case 'boolean':
      return value;
    case 'bigint':
      return `${value}`;
    case 'function':
      context.warnings.push('function_redacted');
      return '[Function]';
    case 'symbol':
      context.warnings.push('symbol_redacted');
      return '[Symbol]';
    default:
      break;
  }

  if (depth >= MAX_DEPTH) {
    context.truncated = true;
    context.warnings.push('max_depth_reached');
    return TRUNCATED;
  }

  const obj = value;
  if (seen.has(obj)) {
    context.warnings.push('circular_reference');
    return CIRCULAR;
  }
  seen.add(obj);

  if (value instanceof Error) {
    const message = redactText(value.message);
    context.kinds.push(...message.redactedKinds);
    context.warnings.push(...message.warnings);
    context.truncated ||= message.truncated;
    return { name: value.name, message: message.safeText };
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactInternal(item, depth + 1, seen, context));
  }

  const result = {};
  for (const key of Object.keys(value)) {
    if (isSensitiveKey(key)) {
      result[key] = REDACTED;
      context.kinds.push('sensitive_key');
    } else {
      result[key] = redactInternal(value[key], depth + 1, seen, context);
    }
  }

  return result;
}
