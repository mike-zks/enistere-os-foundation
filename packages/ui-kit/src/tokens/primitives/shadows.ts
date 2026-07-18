/**
 * Ombres PRIMITIVES, STRUCTURÉES (jamais une chaîne CSS). Offsets/blur/spread en px canoniques ;
 * `color` hex + `opacity` (0..1) → `rgba` côté CSS ; `elevation` pour React Native/Flutter.
 */
import type { ShadowToken } from '../contracts.js';

export const shadows = {
  none: { x: 0, y: 0, blur: 0, spread: 0, color: '#000000', opacity: 0, elevation: 0 },
  sm: { x: 0, y: 1, blur: 2, spread: 0, color: '#0F172A', opacity: 0.08, elevation: 1 },
  md: { x: 0, y: 4, blur: 8, spread: -2, color: '#0F172A', opacity: 0.12, elevation: 3 },
  lg: { x: 0, y: 12, blur: 24, spread: -4, color: '#0F172A', opacity: 0.16, elevation: 6 },
} satisfies Readonly<Record<string, ShadowToken>>;
