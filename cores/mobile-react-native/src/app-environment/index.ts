/**
 * Generic, NON-IDENTIFYING app-environment primitives (RN 22).
 *
 * A bounded snapshot model (OS family + major OS version + app/build version +
 * build channel + locale + runtime environment) behind a strict allow-list, an
 * agnostic adapter contract (seam for `expo-application`/`expo-device`), an
 * in-memory placeholder adapter (defensive copies), and a best-effort,
 * non-intrusive service exposing a safe telemetry context.
 *
 * GENERIC only — NO real `expo-device`/`expo-application`, NO network, NO device/
 * installation/vendor id (IDFA/Android ID/push token/serial/MAC/IP), NO precise
 * model, NO PII, NO automatic collection. It provides a SAFE context only; a
 * future telemetry adapter applies the RN 21 consent gate before using it (RN 22
 * does not wire analytics/crash and decides no SDK). See ARCHITECTURE §31.
 */
export {
  isAppOs,
  normalizeOs,
  normalizeMajorVersion,
  normalizeAppVersion,
  normalizeBuildNumber,
  normalizeBuildChannel,
  normalizeRuntimeEnvironment,
  normalizeLocaleField,
  sanitizeAppEnvironmentSnapshot,
  describeAppEnvironmentForLog,
  MAX_APP_VERSION_LENGTH,
  MAX_BUILD_NUMBER_LENGTH,
  MAX_BUILD_CHANNEL_LENGTH,
  MAX_LOCALE_LENGTH,
  MAX_OS_VERSION_MAJOR,
} from './model';
export type {
  AppOs,
  AppRuntimeEnvironment,
  AppEnvironmentSnapshot,
  SafeAppEnvironmentDescriptor,
} from './model';

export { AppEnvironmentAdapterError } from './adapter';
export type { AppEnvironmentAdapter } from './adapter';

export { createPlaceholderAppEnvironmentAdapter } from './placeholder-adapter';
export type { PlaceholderAppEnvironmentAdapter } from './placeholder-adapter';

export { createAppEnvironmentService } from './service';
export type { AppEnvironmentService, AppEnvironmentServiceOptions } from './service';
