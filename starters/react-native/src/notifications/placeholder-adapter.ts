/**
 * Documented placeholder notification adapter (RN 10 — notifications).
 *
 * A dependency-free {@link NotificationAdapter} for wiring and tests. It
 * simulates LOCAL scheduling in memory — NO native module, NO Expo
 * notifications, NO real push, NO device/push token (mission). A derived project
 * replaces it with a real adapter (e.g. `expo-notifications`); the contract and
 * the {@link NotificationService} stay identical.
 *
 * Behaviour: an in-memory permission status (default `unknown`; `request` grants
 * unless `blocked`/`unavailable`) + an in-memory map of scheduled notifications.
 * Ids are a deterministic counter (`<prefix>-1`, `-2`…), so no `Date.now()` /
 * `Math.random()` and tests are reproducible. In-memory only — never persisted.
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import { normalizePermissionStatus, type PermissionStatus } from '../permissions/status';
import { sanitizeNotificationMessage } from './message';
import {
  normalizeTrigger,
  type LocalNotificationRequest,
  type NotificationAdapter,
  type ScheduledNotification,
} from './types';

export interface PlaceholderNotificationConfig {
  /** Seed permission status (default `unknown`). */
  readonly permission?: PermissionStatus;
  /** Decide the result of `requestPermission` (default: grant unless blocked/unavailable). */
  readonly onRequest?: (current: PermissionStatus) => PermissionStatus;
  /** Id prefix for scheduled notifications (default `local`). */
  readonly idPrefix?: string;
}

const defaultDecision = (current: PermissionStatus): PermissionStatus =>
  current === 'blocked' || current === 'unavailable' ? current : 'granted';

/** Create an in-memory placeholder notification adapter (no native dependency). */
export function createPlaceholderNotificationAdapter(
  config: PlaceholderNotificationConfig = {},
): NotificationAdapter {
  let permission = normalizePermissionStatus(config.permission ?? 'unknown');
  const decide = config.onRequest ?? defaultDecision;
  const prefix = config.idPrefix ?? 'local';
  const scheduled = new Map<string, ScheduledNotification>();
  let counter = 0;

  return {
    async getPermissionStatus(): Promise<PermissionStatus> {
      return permission;
    },
    async requestPermission(): Promise<PermissionStatus> {
      permission = normalizePermissionStatus(decide(permission));
      return permission;
    },
    async scheduleLocal(request: LocalNotificationRequest): Promise<string> {
      counter += 1;
      const id = `${prefix}-${counter}`;
      scheduled.set(id, {
        id,
        message: sanitizeNotificationMessage(request.message),
        trigger: normalizeTrigger(request.trigger),
        state: 'scheduled',
      });
      return id;
    },
    async cancel(id: string): Promise<void> {
      scheduled.delete(id);
    },
    async cancelAll(): Promise<void> {
      scheduled.clear();
    },
    async getDelivered(): Promise<readonly ScheduledNotification[]> {
      return [...scheduled.values()];
    },
  };
}
