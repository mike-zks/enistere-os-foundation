/**
 * Échelle d'espacement PRIMITIVE. Nombres en px canoniques (Web : `px`/`rem` ; React Native : nombre brut).
 * Base 4 px ; les clés sont les multiplicateurs logiques.
 */
export const spacing = {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
  '16': 64,
  '20': 80,
  '24': 96,
} satisfies Readonly<Record<string, number>>;
