import { IsIn, IsOptional } from 'class-validator';

/**
 * Raisons de quarantaine GÉNÉRIQUES et bornées (ADR-003). Pas de texte libre, aucune donnée
 * sensible, aucune description de contenu malveillant, aucune catégorie métier.
 */
export const QUARANTINE_REASON_CODES = [
  'SECURITY_REVIEW',
  'CONTENT_MISMATCH',
  'POLICY_VIOLATION',
  'MANUAL_ACTION',
] as const;

export type QuarantineReasonCode = (typeof QUARANTINE_REASON_CODES)[number];

export const DEFAULT_QUARANTINE_REASON: QuarantineReasonCode = 'MANUAL_ACTION';

export class QuarantineFileDto {
  @IsOptional()
  @IsIn(QUARANTINE_REASON_CODES)
  reasonCode?: QuarantineReasonCode;
}
