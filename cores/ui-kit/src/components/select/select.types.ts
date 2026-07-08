import type { CSSProperties, SelectHTMLAttributes } from 'react';

export type SelectSize = 'sm' | 'md' | 'lg';

/**
 * `size` natif (nombre de lignes visibles) est remplacé par le token `sm`/`md`/`lg`.
 * `className` et `style` sont appliqués au **wrapper** (`<span>`) pour contrôler la disposition.
 * Les attributs `<select>` natifs (name, value, onChange, disabled, required…) passent à l'élément interne.
 */
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: SelectSize;
  /** Marque le champ invalide (`aria-invalid`) + style d'erreur. */
  invalid?: boolean;
  /** Appliqué au wrapper `<span>` (mise en page externe). */
  className?: string;
  /** Appliqué au wrapper `<span>` (mise en page externe). */
  style?: CSSProperties;
}
