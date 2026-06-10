import { forwardRef } from 'react';

import { mergeClassNames } from '../../utilities/merge-class-names.js';
import type { AlertProps, AlertVariant } from './alert.types.js';

/** Rôle par défaut : assertif pour `danger`, poli pour le reste (évite la sur-verbosité des lecteurs d'écran). */
const DEFAULT_ROLE: Record<AlertVariant, 'status' | 'alert'> = {
  info: 'status',
  success: 'status',
  warning: 'status',
  danger: 'alert',
};

/**
 * Message d'information générique (primitive visuelle, sans connaissance HTTP/Auth). La variante est
 * conveyée par un **glyphe décoratif** (forme, via CSS), un accent de bordure et le **titre** — jamais
 * par la couleur seule. Le glyphe est `aria-hidden` ; le sens passe par le rôle + le contenu textuel.
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { variant = 'info', title, role, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role={role ?? DEFAULT_ROLE[variant]}
      className={mergeClassNames('enistere-alert', `enistere-alert--${variant}`, className)}
      {...rest}
    >
      <span className="enistere-alert__icon" aria-hidden="true" />
      <div className="enistere-alert__body">
        {title !== undefined ? <p className="enistere-alert__title">{title}</p> : null}
        <div className="enistere-alert__content">{children}</div>
      </div>
    </div>
  );
});
