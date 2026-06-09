/**
 * Fabrique d'identifiant de corrélation client (`X-Request-Id`).
 * Utilise `crypto.randomUUID()` (natif navigateur/Node/React Native modernes) ; repli injectable.
 */
export type RequestIdFactory = () => string;

export function defaultRequestIdFactory(): string {
  const cryptoRef = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoRef && typeof cryptoRef.randomUUID === 'function') {
    return cryptoRef.randomUUID();
  }
  // Repli non cryptographique : la corrélation n'est PAS une donnée de sécurité.
  return `req-${Math.abs(hashTime()).toString(36)}`;
}

// Évite Date.now()/Math.random() directement dans un chemin testé déterministiquement :
// ce repli n'est utilisé que si crypto.randomUUID est indisponible (plateformes très anciennes).
function hashTime(): number {
  const perf = (globalThis as { performance?: { now?: () => number } }).performance;
  const t = perf && typeof perf.now === 'function' ? perf.now() : 0;
  return Math.floor(t * 1000) ^ 0x9e3779b9;
}
