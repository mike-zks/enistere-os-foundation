/**
 * Notification scheduling types + adapter contract (RN 10 — notifications).
 *
 * Generic, LOCAL-only primitives: a delivery-state enum, a bounded trigger, a
 * schedule request, and the {@link NotificationAdapter} seam toward a platform
 * implementation (Expo `expo-notifications`, …). The foundation ships only the
 * contract + a documented placeholder — NO real push, NO device/push token.
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { PermissionStatus } from '../permissions/status';
import type { NotificationMessage } from './message';

/** Lifecycle state of a (local) notification. */
export type NotificationDeliveryState =
  | 'scheduled'
  | 'delivered'
  | 'cancelled'
  | 'failed'
  | 'unknown';

const DELIVERY_STATES: ReadonlySet<NotificationDeliveryState> = new Set([
  'scheduled',
  'delivered',
  'cancelled',
  'failed',
  'unknown',
]);

/** Type guard for a {@link NotificationDeliveryState}. */
export function isNotificationDeliveryState(value: unknown): value is NotificationDeliveryState {
  return typeof value === 'string' && DELIVERY_STATES.has(value as NotificationDeliveryState);
}

/** True for a state that will not change further (delivered/cancelled/failed). */
export function isTerminalDeliveryState(state: NotificationDeliveryState): boolean {
  return state === 'delivered' || state === 'cancelled' || state === 'failed';
}

/** When a local notification should fire. Bounded, no real timer here. */
export type NotificationTrigger =
  | { readonly type: 'immediate' }
  | { readonly type: 'delay'; readonly seconds: number }
  | { readonly type: 'date'; readonly timestamp: number };

/**
 * Normalise an arbitrary trigger into a valid {@link NotificationTrigger}.
 * Missing/invalid → `immediate`; negative delays are clamped to `0`.
 */
export function normalizeTrigger(trigger: unknown): NotificationTrigger {
  if (typeof trigger !== 'object' || trigger === null) {
    return { type: 'immediate' };
  }
  const t = trigger as { type?: unknown; seconds?: unknown; timestamp?: unknown };
  if (t.type === 'delay' && typeof t.seconds === 'number' && Number.isFinite(t.seconds)) {
    return { type: 'delay', seconds: Math.max(0, Math.floor(t.seconds)) };
  }
  if (t.type === 'date' && typeof t.timestamp === 'number' && Number.isFinite(t.timestamp)) {
    return { type: 'date', timestamp: t.timestamp };
  }
  return { type: 'immediate' };
}

/** A request to schedule a local notification. */
export interface LocalNotificationRequest {
  readonly message: NotificationMessage;
  readonly trigger?: NotificationTrigger;
}

/** A notification recorded by an adapter. */
export interface ScheduledNotification {
  readonly id: string;
  readonly message: NotificationMessage;
  readonly trigger: NotificationTrigger;
  readonly state: NotificationDeliveryState;
}

/**
 * Seam between the agnostic {@link NotificationService} and a platform impl. The
 * foundation provides the contract + a placeholder; a derived project wires a
 * real adapter (e.g. `expo-notifications`). The permission methods mirror the
 * RN 9 permission shape for the `notifications` kind.
 */
export interface NotificationAdapter {
  getPermissionStatus(): Promise<PermissionStatus>;
  requestPermission(): Promise<PermissionStatus>;
  /** Schedule a LOCAL notification and return its id. */
  scheduleLocal(request: LocalNotificationRequest): Promise<string>;
  cancel(id: string): Promise<void>;
  cancelAll(): Promise<void>;
  /** Optionally list scheduled/delivered notifications. */
  getDelivered?(): Promise<readonly ScheduledNotification[]>;
}
