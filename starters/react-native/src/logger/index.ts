/**
 * Generic client logger / observability primitives (RN 8).
 *
 * A typed logging facade (`debug`/`info`/`warn`/`error`) with a pluggable sink,
 * level filtering, `requestId` correlation and CENTRAL redaction of sensitive
 * data (tokens, Authorization, cookies, signed URLs, device paths, PII). No
 * persistence, no network transport, no external observability backend, no
 * automatic body logging. See ARCHITECTURE §17 and ADR-040.
 */
export {
  createLogger,
  consoleSink,
  isLevelEnabled,
} from './logger';
export type { Logger, LoggerOptions, LogLevel, LogRecord, LogSink } from './logger';

export { REDACTED, redactValue, redactString, isSensitiveKey } from './redaction';

export { safeErrorFields } from './error-fields';
export type { SafeErrorFields } from './error-fields';
