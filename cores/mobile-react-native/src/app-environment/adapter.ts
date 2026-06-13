/**
 * App-environment adapter contract (RN 22 — app environment).
 *
 * The seam between the agnostic {@link AppEnvironmentService} and the platform
 * source (a future `expo-application`/`expo-device` wrapper: `Device.osName`,
 * `Device.osVersion`, `Application.nativeApplicationVersion`,
 * `Application.nativeBuildVersion`, `Updates.channel`…). The foundation ships
 * only the contract + an in-memory placeholder — NO real `expo-device`, NO real
 * `expo-application`, NO native module, NO network (mission).
 *
 * The adapter returns a *raw-ish* snapshot; the service sanitises it through the
 * strict allow-list, so a real adapter that accidentally exposes an identifier
 * can never leak it. A derived adapter MUST NOT read device/installation ids,
 * IDFA, push tokens, serials, MAC/IP or a precise model.
 *
 * Synchronous: the underlying expo constants are synchronous. Agnostic (no
 * React/RN import) → `node --test`-able.
 */
import type { AppEnvironmentSnapshot } from './model';

export interface AppEnvironmentAdapter {
  /** Read the current (raw-ish, non-identifying) environment snapshot. */
  getSnapshot(): AppEnvironmentSnapshot;
}

/**
 * Controlled error for a failed adapter operation. Carries only the safe
 * `operation` — NO underlying value/cause (no sensitive leak).
 */
export class AppEnvironmentAdapterError extends Error {
  readonly operation: 'getSnapshot';

  constructor(operation: 'getSnapshot') {
    super(`App environment adapter "${operation}" failed.`);
    this.name = 'AppEnvironmentAdapterError';
    this.operation = operation;
  }
}
