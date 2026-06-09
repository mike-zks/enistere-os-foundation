/**
 * Motion PRIMITIVE. `duration` en ms ; `easing` = courbe cubic-bézier agnostique (Web : `cubic-bezier`,
 * React Native : `Easing.bezier`). La réduction des animations (`prefers-reduced-motion`) est gérée par
 * les plateformes, pas par les tokens.
 */
import type { EasingToken } from '../contracts.js';

export const duration = {
  fast: 120,
  normal: 200,
  slow: 320,
} satisfies Readonly<Record<string, number>>;

export const easing = {
  standard: { cubicBezier: [0.2, 0, 0, 1] },
  emphasized: { cubicBezier: [0.2, 0, 0, 1] },
  decelerate: { cubicBezier: [0, 0, 0, 1] },
  accelerate: { cubicBezier: [0.3, 0, 1, 1] },
} satisfies Readonly<Record<string, EasingToken>>;
