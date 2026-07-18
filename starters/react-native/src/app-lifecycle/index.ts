/**
 * Generic app-lifecycle primitives (RN 15).
 *
 * A normalised app-state model (`active`/`background`/`inactive`/`unknown`) with
 * pure transition helpers, an agnostic adapter contract (seam for RN `AppState`),
 * an in-memory placeholder adapter, and a best-effort service (validated
 * transitions, safe RN 8 logging — enum fields only). GENERIC only — NO real
 * `AppState`, NO screen/mandatory provider, NO storage, NO business logic. See
 * ARCHITECTURE §24.
 */
export {
  isAppLifecycleState,
  normalizeAppLifecycleState,
  isForeground,
  isBackground,
  isValidTransition,
  nextAppLifecycleState,
} from './state';
export type { AppLifecycleState } from './state';

export { AppLifecycleAdapterError } from './adapter';
export type { AppLifecycleAdapter } from './adapter';

export { createPlaceholderAppLifecycleAdapter } from './placeholder-adapter';
export type { PlaceholderAppLifecycleAdapter } from './placeholder-adapter';

export { createAppLifecycleService } from './engine';
export type { AppLifecycleService, AppLifecycleServiceOptions } from './engine';
