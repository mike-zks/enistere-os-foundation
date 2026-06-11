/**
 * Environment configuration.
 *
 * SECURITY: only `EXPO_PUBLIC_*` variables are readable in the app bundle and
 * they are PUBLIC. Never read or expect secrets here. Values are inlined by
 * Expo at build time, so we read them directly from `process.env`.
 */

export type AppEnvironment = 'local' | 'staging' | 'production';

export interface AppConfig {
  /** Logical environment name. */
  readonly environment: AppEnvironment;
  /** Base URL of the API Core. No trailing slash. */
  readonly apiBaseUrl: string;
  /** Default HTTP request timeout in milliseconds. */
  readonly apiTimeoutMs: number;
}

const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const DEFAULT_API_TIMEOUT_MS = 15_000;

function parseEnvironment(value: string | undefined): AppEnvironment {
  if (value === 'staging' || value === 'production') {
    return value;
  }
  return 'local';
}

function parseTimeout(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_API_TIMEOUT_MS;
}

function normalizeBaseUrl(value: string | undefined): string {
  const raw = value && value.length > 0 ? value : DEFAULT_API_BASE_URL;
  return raw.replace(/\/+$/, '');
}

/**
 * Resolved, validated application configuration.
 *
 * This is computed once at module load. The starter intentionally fails soft
 * (falls back to sane local defaults) so the app can boot in development even
 * when env vars are missing.
 */
export const appConfig: AppConfig = {
  environment: parseEnvironment(process.env.EXPO_PUBLIC_APP_ENV),
  apiBaseUrl: normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL),
  apiTimeoutMs: parseTimeout(process.env.EXPO_PUBLIC_API_TIMEOUT_MS),
};

/** True only in the production environment. */
export const isProduction = appConfig.environment === 'production';
