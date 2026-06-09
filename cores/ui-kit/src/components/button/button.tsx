import { forwardRef } from 'react';

import { mergeClassNames } from '../../utilities/merge-class-names.js';
import { Spinner } from '../spinner/spinner.js';
import type { ButtonProps } from './button.types.js';

/**
 * Bouton natif accessible. `type="button"` par défaut, désactivé réel pendant `loading` (donc aucun
 * `onClick`), `aria-busy` en chargement, spinner décoratif (jamais annoncé deux fois).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, loadingText, type, disabled, className, children, ...rest },
  ref,
) {
  const isDisabled = disabled === true || loading;
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={mergeClassNames(
        'enistere-button',
        `enistere-button--${variant}`,
        `enistere-button--${size}`,
        loading && 'enistere-button--loading',
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner size="sm" decorative className="enistere-button__spinner" /> : null}
      <span className="enistere-button__label">
        {loading && loadingText !== undefined ? loadingText : children}
      </span>
    </button>
  );
});
