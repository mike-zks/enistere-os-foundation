/**
 * Safe, NON-IDENTIFYING app-environment snapshot model (RN 22 — app environment).
 *
 * Generic primitives for coarse technical context (OS family, major OS version,
 * app/build version, build channel, locale, runtime environment) intended to be
 * attached LATER to telemetry (analytics RN 13 / crash RN 19) — once gated by the
 * RN 21 consent. The foundation ships GENERIC primitives only: NO real
 * `expo-device`/`expo-application`, NO network, NO automatic collection (mission).
 *
 * PRIVACY (strict allow-list, default-coarse) — the snapshot may carry ONLY the
 * fields below, all deliberately COARSE and NON-IDENTIFYING. It NEVER carries a
 * device/installation/vendor id, IDFA, Android ID, push token, serial, MAC/IP, a
 * precise device model, or any PII: `sanitizeAppEnvironmentSnapshot` reads ONLY
 * the known keys, so any such field in a raw input is simply dropped. The OS
 * version is reduced to its MAJOR only.
 *
 * Every helper TOLERATES invalid input (returns a safe default, never throws).
 * PURE / framework-agnostic (no React/RN import; no `Date.now()`) → unit-tested
 * under `node --test`. Reuses the i18n `normalizeLocale` (no dependency cycle).
 */
import { normalizeLocale } from '../i18n/locale';

/** OS family — coarse, never a precise model. */
export type AppOs = 'ios' | 'android' | 'web' | 'unknown';

/** Logical runtime environment (broader than the build-time `AppEnvironment`). */
export type AppRuntimeEnvironment = 'local' | 'development' | 'staging' | 'production' | 'test';

/** A bounded, non-identifying environment snapshot. */
export interface AppEnvironmentSnapshot {
  readonly os: AppOs;
  /** MAJOR OS version only (e.g. `17` from `17.5.1`). */
  readonly osVersionMajor?: number;
  /** App marketing version (e.g. `1.4.0`), bounded + allow-listed. */
  readonly appVersion?: string;
  /** Native build number (e.g. `142`), bounded + allow-listed. */
  readonly buildNumber?: string;
  /** Release channel (e.g. `production`/`preview`), bounded slug. */
  readonly buildChannel?: string;
  /** Canonical locale (e.g. `fr-FR`), via the i18n normaliser. */
  readonly locale?: string;
  /** Logical runtime environment. */
  readonly environment?: AppRuntimeEnvironment;
}

/** Safe log descriptor — coarse enums / numbers ONLY. */
export interface SafeAppEnvironmentDescriptor {
  readonly os: AppOs;
  readonly osVersionMajor?: number;
  readonly buildChannel?: string;
  readonly environment?: AppRuntimeEnvironment;
}

// --- Defensive bounds -----------------------------------------------------------
export const MAX_APP_VERSION_LENGTH = 32;
export const MAX_BUILD_NUMBER_LENGTH = 32;
export const MAX_BUILD_CHANNEL_LENGTH = 32;
export const MAX_LOCALE_LENGTH = 35;
export const MAX_OS_VERSION_MAJOR = 999;

const OS_VALUES: ReadonlySet<AppOs> = new Set(['ios', 'android', 'web', 'unknown']);

const OS_ALIASES: Readonly<Record<string, AppOs>> = {
  ios: 'ios',
  ipados: 'ios',
  android: 'android',
  web: 'web',
  browser: 'web',
};

const ENVIRONMENT_ALIASES: Readonly<Record<string, AppRuntimeEnvironment>> = {
  local: 'local',
  dev: 'development',
  development: 'development',
  staging: 'staging',
  stage: 'staging',
  preview: 'staging',
  prod: 'production',
  production: 'production',
  test: 'test',
};

/** Version/build token: starts alphanumeric, then `[A-Za-z0-9.+-]` only. */
const VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9.+-]*$/;
/** Channel slug: starts alphanumeric, then `[a-z0-9._-]` only (lowercased). */
const CHANNEL_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

/** Type guard for a normalised {@link AppOs}. */
export function isAppOs(value: unknown): value is AppOs {
  return typeof value === 'string' && OS_VALUES.has(value as AppOs);
}

/** Fold any raw value into an {@link AppOs}. Unknown/invalid → `unknown`. */
export function normalizeOs(value: unknown): AppOs {
  if (typeof value !== 'string') {
    return 'unknown';
  }
  return OS_ALIASES[value.trim().toLowerCase()] ?? 'unknown';
}

/**
 * Reduce a version to its MAJOR integer (e.g. `17.5.1` → `17`, `18` → `18`),
 * bounded to {@link MAX_OS_VERSION_MAJOR}. Returns `undefined` when absent/invalid.
 */
export function normalizeMajorVersion(value: unknown): number | undefined {
  let major: number | undefined;
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    major = Math.floor(value);
  } else if (typeof value === 'string') {
    const match = /^\s*(\d{1,4})/.exec(value);
    major = match ? Number.parseInt(match[1] ?? '', 10) : undefined;
  }
  if (major === undefined || !Number.isFinite(major) || major < 0) {
    return undefined;
  }
  return Math.min(major, MAX_OS_VERSION_MAJOR);
}

function normalizeVersionToken(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  const bounded = trimmed.length > max ? trimmed.slice(0, max) : trimmed;
  return VERSION_PATTERN.test(bounded) ? bounded : undefined;
}

/** App marketing version — bounded + allow-listed, else `undefined`. */
export function normalizeAppVersion(value: unknown): string | undefined {
  return normalizeVersionToken(value, MAX_APP_VERSION_LENGTH);
}

/** Native build number — bounded + allow-listed, else `undefined`. */
export function normalizeBuildNumber(value: unknown): string | undefined {
  return normalizeVersionToken(value, MAX_BUILD_NUMBER_LENGTH);
}

/** Release channel — bounded lowercase slug, else `undefined`. */
export function normalizeBuildChannel(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const slug = value.trim().toLowerCase();
  if (slug.length === 0) {
    return undefined;
  }
  const bounded = slug.length > MAX_BUILD_CHANNEL_LENGTH ? slug.slice(0, MAX_BUILD_CHANNEL_LENGTH) : slug;
  return CHANNEL_PATTERN.test(bounded) ? bounded : undefined;
}

/** Logical runtime environment — allow-listed, else `undefined`. */
export function normalizeRuntimeEnvironment(value: unknown): AppRuntimeEnvironment | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  return ENVIRONMENT_ALIASES[value.trim().toLowerCase()];
}

/** Canonical locale via the i18n normaliser — bounded, else `undefined`. */
export function normalizeLocaleField(value: unknown): string | undefined {
  const canonical = normalizeLocale(value, '');
  if (canonical.length === 0) {
    return undefined;
  }
  return canonical.length > MAX_LOCALE_LENGTH ? canonical.slice(0, MAX_LOCALE_LENGTH) : canonical;
}

/**
 * Build a frozen, NON-IDENTIFYING {@link AppEnvironmentSnapshot} from a raw
 * value. Reads ONLY the known allow-listed keys — any other field (device id,
 * IDFA, serial, model…) in the input is dropped. Undefined fields are omitted;
 * `os` defaults to `unknown`. Never throws.
 */
export function sanitizeAppEnvironmentSnapshot(value: unknown): AppEnvironmentSnapshot {
  const source = (value ?? {}) as Record<string, unknown>;
  const osVersionMajor = normalizeMajorVersion(source.osVersionMajor ?? source.osVersion);
  const appVersion = normalizeAppVersion(source.appVersion);
  const buildNumber = normalizeBuildNumber(source.buildNumber);
  const buildChannel = normalizeBuildChannel(source.buildChannel);
  const locale = normalizeLocaleField(source.locale);
  const environment = normalizeRuntimeEnvironment(source.environment);

  return Object.freeze({
    os: normalizeOs(source.os),
    ...(osVersionMajor !== undefined ? { osVersionMajor } : {}),
    ...(appVersion !== undefined ? { appVersion } : {}),
    ...(buildNumber !== undefined ? { buildNumber } : {}),
    ...(buildChannel !== undefined ? { buildChannel } : {}),
    ...(locale !== undefined ? { locale } : {}),
    ...(environment !== undefined ? { environment } : {}),
  });
}

/** Safe log view — coarse enums/numbers ONLY (no version/locale strings). */
export function describeAppEnvironmentForLog(
  snapshot: AppEnvironmentSnapshot,
): SafeAppEnvironmentDescriptor {
  return {
    os: snapshot.os,
    ...(snapshot.osVersionMajor !== undefined ? { osVersionMajor: snapshot.osVersionMajor } : {}),
    ...(snapshot.buildChannel !== undefined ? { buildChannel: snapshot.buildChannel } : {}),
    ...(snapshot.environment !== undefined ? { environment: snapshot.environment } : {}),
  };
}
