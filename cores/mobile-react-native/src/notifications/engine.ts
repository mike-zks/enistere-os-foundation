/**
 * Framework-agnostic local-notification service (RN 10 — notifications).
 *
 * Gates LOCAL notification scheduling on the RN 9 `notifications` permission and
 * orchestrates a {@link NotificationAdapter}. It NEVER schedules when the
 * permission is not usable (mission), NEVER ships a real push service, and NEVER
 * handles a device/push/FCM/APNs token.
 *
 * Permission (RN 9 reuse) : the service drives a {@link PermissionService} for
 * the `notifications` kind — either an injected one, or one built from the
 * adapter's `getPermissionStatus`/`requestPermission`. Normalisation + the
 * `isPermissionUsable` gate come straight from RN 9.
 *
 * Logging (ADR-040 / RN 8) : optional injected logger; logs ONLY safe fields
 * (`{ id }`, `{ status }`, `{ state }`, `{ count }`) — NEVER a notification
 * `title`/`body`/`data` (potential PII), and never bypasses redaction. Adapter
 * failures log a `warn` and re-throw a controlled {@link NotificationError} (no
 * sensitive cause).
 *
 * PURE / framework-agnostic (no React/RN import) → `node --test`-able.
 */
import type { Logger } from '../logger/logger';
import type { PermissionAdapter } from '../permissions/adapter';
import { createPermissionService, type PermissionService } from '../permissions/engine';
import { isPermissionUsable, type PermissionStatus } from '../permissions/status';
import { sanitizeNotificationMessage } from './message';
import {
  normalizeTrigger,
  type LocalNotificationRequest,
  type NotificationAdapter,
  type ScheduledNotification,
} from './types';

/** Outcome of a schedule attempt. */
export type ScheduleResult =
  | { readonly state: 'scheduled'; readonly id: string }
  | { readonly state: 'blocked'; readonly reason: 'permission'; readonly status: PermissionStatus };

export interface NotificationService {
  /** Live notification-permission status (RN 9). */
  getPermissionStatus(): Promise<PermissionStatus>;
  /** Prompt for the notification permission (RN 9). */
  requestPermission(): Promise<PermissionStatus>;
  /**
   * Schedule a LOCAL notification — ONLY if the permission is usable
   * (`granted`/`limited`); otherwise returns `{ state: 'blocked' }` WITHOUT
   * touching the adapter. The message is sanitised/bounded first.
   */
  schedule(request: LocalNotificationRequest): Promise<ScheduleResult>;
  cancel(id: string): Promise<void>;
  cancelAll(): Promise<void>;
  /** List scheduled notifications if the adapter supports it (else `[]`). */
  getDelivered(): Promise<readonly ScheduledNotification[]>;
}

export interface NotificationServiceOptions {
  readonly adapter: NotificationAdapter;
  /** Optional RN 9 permission service; built from the adapter when omitted. */
  readonly permissionService?: PermissionService;
  /** Optional RN 8 logger (safe fields only). */
  readonly logger?: Logger;
}

/** Build a {@link NotificationService} over a notification adapter (+ RN 9 / RN 8). */
export function createNotificationService(
  options: NotificationServiceOptions,
): NotificationService {
  const { adapter, logger } = options;

  // Reuse RN 9 : drive the `notifications` permission via a PermissionService.
  const permissionAdapter: PermissionAdapter = {
    getStatus: () => adapter.getPermissionStatus(),
    request: () => adapter.requestPermission(),
  };
  const permissions =
    options.permissionService ?? createPermissionService({ adapter: permissionAdapter, logger });

  const getPermissionStatus = (): Promise<PermissionStatus> => permissions.getStatus('notifications');
  const requestPermission = (): Promise<PermissionStatus> => permissions.request('notifications');

  async function schedule(request: LocalNotificationRequest): Promise<ScheduleResult> {
    const status = await permissions.ensure('notifications');
    if (!isPermissionUsable(status)) {
      // Never schedule without a usable permission — adapter is NOT touched.
      logger?.info('notification scheduling blocked', { status });
      return { state: 'blocked', reason: 'permission', status };
    }
    const message = sanitizeNotificationMessage(request.message);
    const trigger = normalizeTrigger(request.trigger);
    try {
      const id = await adapter.scheduleLocal({ message, trigger });
      logger?.info('notification scheduled', { id });
      return { state: 'scheduled', id };
    } catch {
      logger?.warn('notification schedule failed');
      throw new NotificationError('schedule');
    }
  }

  async function cancel(id: string): Promise<void> {
    try {
      await adapter.cancel(id);
      logger?.debug('notification cancelled', { id });
    } catch {
      logger?.warn('notification cancel failed');
      throw new NotificationError('cancel');
    }
  }

  async function cancelAll(): Promise<void> {
    try {
      await adapter.cancelAll();
      logger?.debug('notifications cancelled (all)');
    } catch {
      logger?.warn('notification cancelAll failed');
      throw new NotificationError('cancelAll');
    }
  }

  async function getDelivered(): Promise<readonly ScheduledNotification[]> {
    if (!adapter.getDelivered) {
      logger?.warn('notification getDelivered unsupported');
      return [];
    }
    try {
      const delivered = await adapter.getDelivered();
      logger?.debug('notifications listed', { count: delivered.length });
      return delivered;
    } catch {
      logger?.warn('notification getDelivered failed');
      throw new NotificationError('getDelivered');
    }
  }

  return { getPermissionStatus, requestPermission, schedule, cancel, cancelAll, getDelivered };
}

/**
 * Controlled error for a failed adapter operation. Carries only the safe
 * `operation` (no underlying message/cause → no sensitive leak).
 */
export class NotificationError extends Error {
  readonly operation: 'schedule' | 'cancel' | 'cancelAll' | 'getDelivered';

  constructor(operation: 'schedule' | 'cancel' | 'cancelAll' | 'getDelivered') {
    super(`Notification adapter "${operation}" failed.`);
    this.name = 'NotificationError';
    this.operation = operation;
  }
}
