export { appConfig, isProduction } from './env';
export type { AppConfig, AppEnvironment } from './env';

// --- RN 17: generic feature flags / config (separate from RN 6 Zustand UI flags) ---
export {
  MAX_FLAG_KEY_LENGTH,
  MAX_FLAG_VALUE_LENGTH,
  MAX_FLAGS,
  isValidFlagKey,
  normalizeFlagValue,
  sanitizeFlagSet,
  getBooleanFlag,
  getStringFlag,
  getNumberFlag,
  getFlagValue,
  describeFlagsForLog,
} from './flag-model';
export type { FlagValue, FlagSet, SafeFlagsDescriptor } from './flag-model';

export { FlagAdapterError } from './flag-adapter';
export type { FlagAdapter } from './flag-adapter';

export { createPlaceholderFlagAdapter } from './placeholder-flag-adapter';
export type { PlaceholderFlagAdapter } from './placeholder-flag-adapter';

export { createFlagService } from './flag-service';
export type { FlagService, FlagServiceOptions } from './flag-service';
