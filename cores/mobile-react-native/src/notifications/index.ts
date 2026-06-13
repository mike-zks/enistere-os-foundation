/**
 * Generic local-notification primitives (RN 10).
 *
 * A bounded/safe message model + helpers, a delivery-state/trigger model, an
 * agnostic adapter contract, a framework-agnostic service (gated on the RN 9
 * `notifications` permission, safe RN 8 logging), and a documented
 * dependency-free placeholder adapter. LOCAL only — NO real push service, NO Expo
 * notifications, NO device/push token, NO UI. See ARCHITECTURE §19.
 */
export {
  MAX_TITLE_LENGTH,
  MAX_BODY_LENGTH,
  MAX_DATA_KEYS,
  MAX_DATA_VALUE_LENGTH,
  isNotificationMessage,
  sanitizeNotificationMessage,
  describeNotificationForLog,
} from './message';
export type {
  NotificationMessage,
  NotificationDataValue,
  SafeNotificationDescriptor,
} from './message';

export {
  isNotificationDeliveryState,
  isTerminalDeliveryState,
  normalizeTrigger,
} from './types';
export type {
  NotificationDeliveryState,
  NotificationTrigger,
  LocalNotificationRequest,
  ScheduledNotification,
  NotificationAdapter,
} from './types';

export {
  createNotificationService,
  NotificationError,
} from './engine';
export type {
  NotificationService,
  NotificationServiceOptions,
  ScheduleResult,
} from './engine';

export { createPlaceholderNotificationAdapter } from './placeholder-adapter';
export type { PlaceholderNotificationConfig } from './placeholder-adapter';
