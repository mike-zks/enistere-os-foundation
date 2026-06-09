/**
 * Échelle z-index PRIMITIVE — limitée et ordonnée pour éviter les valeurs arbitraires dispersées.
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  toast: 1400,
  tooltip: 1500,
} satisfies Readonly<Record<string, number>>;
