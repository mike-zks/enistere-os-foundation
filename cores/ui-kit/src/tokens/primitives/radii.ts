/**
 * Rayons de bordure PRIMITIFS. Nombres en px canoniques. `full` = grande valeur pour cercles/pilules.
 */
export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 20,
  full: 9999,
} satisfies Readonly<Record<string, number>>;
