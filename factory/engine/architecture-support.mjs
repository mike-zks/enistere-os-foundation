/**
 * Executable architecture-profile support boundaries.
 *
 * Representation belongs to the CSM validator. This module answers the narrower
 * materialization question against slices that have an operational golden.
 * Keeping the slice explicit prevents one successful topology from promoting
 * every distributed system—or the service-ecosystem profile.
 */

export const DISTRIBUTED_SPRING_NESTJS_SCOPE =
  'exactly two owned API authorities (one Spring, one NestJS), synchronous HTTP contracts, no clients or optional capabilities';

/** Returns the evidence-bound support decision for a distributed-platform CSM. */
export function assessDistributedPlatformSupport(system) {
  const reasons = [];
  const applications = system.applications ?? [];
  const apis = applications.filter((application) => application.kind === 'api');
  const clients = applications.filter((application) => application.kind === 'web' || application.kind === 'mobile');
  const runtimes = apis.map((application) => application.runtime).sort();

  if (apis.length !== 2) reasons.push('the proven slice requires exactly two backend authorities');
  if (clients.length !== 0) reasons.push('official clients are outside the first distributed slice');
  if (JSON.stringify(runtimes) !== JSON.stringify(['nestjs', 'spring'])) {
    reasons.push('the proven runtime pair is Spring + NestJS');
  }
  if ((system.capabilities ?? []).length !== 0) {
    reasons.push('optional capabilities are outside the first distributed slice');
  }
  for (const application of apis) {
    if (!application.ownership?.team || (application.ownership?.domains ?? []).length === 0) {
      reasons.push(`backend authority ${application.id} lacks explicit ownership`);
    }
  }
  const communications = system.communications ?? [];
  if (communications.length === 0) reasons.push('at least one communication contract is required');
  for (const communication of communications) {
    if (communication.mode !== 'synchronous' || communication.protocol !== 'http') {
      reasons.push(`communication ${communication.id} is outside the synchronous HTTP slice`);
    }
  }

  return Object.freeze({
    generatable: reasons.length === 0,
    scope: DISTRIBUTED_SPRING_NESTJS_SCOPE,
    reasons: Object.freeze([...new Set(reasons)]),
  });
}
