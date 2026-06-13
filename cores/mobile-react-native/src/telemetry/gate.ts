/**
 * Consent gate helpers (RN 25 - telemetry coordinator).
 *
 * Thin async wrappers over RN 21 consent. They inherit RN 21 default-deny:
 * only an explicit `granted` allows telemetry emission. Unknown categories,
 * missing consent and store failures all block.
 */
import type { ConsentCategory, ConsentStatus } from '../consent/model';
import type { ConsentService } from '../consent/service';

export interface TelemetryConsentDecision {
  readonly category: ConsentCategory;
  readonly status: ConsentStatus;
  readonly allowed: boolean;
}

/** Read the consent status and fold it into a safe decision. Never throws. */
export async function getTelemetryConsentDecision(
  consent: ConsentService,
  category: ConsentCategory,
): Promise<TelemetryConsentDecision> {
  try {
    const status = await consent.get(category);
    return Object.freeze({ category, status, allowed: status === 'granted' });
  } catch {
    return Object.freeze({ category, status: 'unknown', allowed: false });
  }
}

/** True only when RN 21 consent explicitly grants the category. Never throws. */
export async function isTelemetryCategoryAllowed(
  consent: ConsentService,
  category: ConsentCategory,
): Promise<boolean> {
  return (await getTelemetryConsentDecision(consent, category)).allowed;
}
