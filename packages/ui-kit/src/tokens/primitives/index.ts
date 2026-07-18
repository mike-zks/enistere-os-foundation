/** Assemble les PRIMITIVES (valeurs brutes agnostiques). */
import type { Primitives } from '../contracts.js';
import { breakpoints } from './breakpoints.js';
import { colors } from './colors.js';
import { duration, easing } from './motion.js';
import { radii } from './radii.js';
import { shadows } from './shadows.js';
import { spacing } from './spacing.js';
import { typography } from './typography.js';
import { zIndex } from './zindex.js';

export const primitives = {
  color: colors,
  spacing,
  radius: radii,
  shadow: shadows,
  typography,
  motion: { duration, easing },
  breakpoint: breakpoints,
  zIndex,
} satisfies Primitives;

export { colors, spacing, radii, shadows, typography, duration, easing, breakpoints, zIndex };
