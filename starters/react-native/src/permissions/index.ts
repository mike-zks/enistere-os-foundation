/**
 * Generic governed runtime-permission primitives (RN 9).
 *
 * A normalised permission model + pure helpers, an agnostic adapter contract, a
 * framework-agnostic service (safe RN 8 logging, status never persisted), a
 * documented dependency-free placeholder adapter, and a minimal React hook.
 * Prepares camera/media pickers, uploads and notifications — but does NOT ship
 * a picker, an upload, or real push notifications. See ARCHITECTURE §18.
 */
export {
  PERMISSION_KINDS,
  normalizePermissionStatus,
  canRequestPermission,
  isPermissionGranted,
  isPermissionUsable,
  shouldOpenSettings,
  isPermissionStatus,
} from './status';
export type { PermissionKind, PermissionStatus } from './status';

export type { PermissionAdapter } from './adapter';

export {
  createPermissionService,
  PermissionAdapterError,
} from './engine';
export type { PermissionService, PermissionServiceOptions } from './engine';

export { createPlaceholderPermissionAdapter } from './placeholder-adapter';
export type { PlaceholderPermissionConfig } from './placeholder-adapter';

export { usePermission } from './use-permission';
export type { UsePermissionOptions, UsePermissionResult } from './use-permission';
