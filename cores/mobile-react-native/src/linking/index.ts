/**
 * Generic deep-linking / routing primitives (RN 12).
 *
 * A pure URL/deep-link parser + a safe link resolver that maps an incoming link
 * to a validated internal route, blocks external/unsafe links (strict scheme/
 * host allowlist, no open redirect, no path traversal), drops sensitive query
 * params and bounds the result. Includes a generic notification-link helper
 * (RN 10). GENERIC only — **derived projects define their concrete routes**; no
 * native module, no UI, no link/URL storage. See ARCHITECTURE §21.
 */
export { decodeSafe, parseDeepLink, normalizeUrl } from './url';
export type { ParsedLink } from './url';

export {
  resolveLink,
  isInternalRoute,
  resolveNotificationLink,
} from './resolve';
export type {
  AllowedScheme,
  LinkRoute,
  LinkResolution,
  ExternalReason,
  InvalidReason,
  LinkingConfig,
  NotificationLinkOptions,
} from './resolve';
