import { forwardRef } from 'react';

import { mergeClassNames } from '../../utilities/merge-class-names.js';
import type { ToastProps, ToastRegionProps, ToastVariant } from './toast.types.js';

/** Rôle ARIA : assertif pour `danger`, poli pour le reste. */
const TOAST_ROLE: Record<ToastVariant, 'alert' | 'status'> = {
  info: 'status',
  success: 'status',
  warning: 'status',
  danger: 'alert',
};

const TOAST_LIVE: Record<ToastVariant, 'assertive' | 'polite'> = {
  info: 'polite',
  success: 'polite',
  warning: 'polite',
  danger: 'assertive',
};

/**
 * Notification de courte durée (toast). **Pas de timer interne** — le consommateur contrôle
 * la durée de vie via `onDismiss` et un état React.
 *
 * La variante est conveyée par **glyphe + bordure + titre** (jamais la couleur seule).
 * Rôle `alert` (assertif) pour `danger`, `status` (poli) pour le reste.
 *
 * Placer les toasts dans un `ToastRegion` pour le positionnement et l'isolation de la région live.
 *
 * @example
 * // Timer géré côté application
 * const [toasts, setToasts] = useState<string[]>([]);
 * const dismiss = (id: string) => setToasts(t => t.filter(x => x !== id));
 * <ToastRegion>
 *   {toasts.map(id => (
 *     <Toast key={id} variant="success" title="Enregistré" onDismiss={() => dismiss(id)}>
 *       Vos modifications ont été sauvegardées.
 *     </Toast>
 *   ))}
 * </ToastRegion>
 */
export const Toast = forwardRef<HTMLDivElement, ToastProps>(function Toast(
  { variant = 'info', title, onDismiss, dismissLabel = 'Fermer', className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role={TOAST_ROLE[variant]}
      aria-live={TOAST_LIVE[variant]}
      aria-atomic="true"
      className={mergeClassNames('enistere-toast', `enistere-toast--${variant}`, className)}
      {...rest}
    >
      <span className="enistere-toast__icon" aria-hidden="true" />
      <div className="enistere-toast__body">
        {title !== undefined ? <p className="enistere-toast__title">{title}</p> : null}
        {children !== undefined ? <div className="enistere-toast__content">{children}</div> : null}
      </div>
      {onDismiss !== undefined ? (
        <button
          type="button"
          className="enistere-toast__close"
          aria-label={dismissLabel}
          onClick={onDismiss}
        />
      ) : null}
    </div>
  );
});

/**
 * Conteneur positionné (`position: fixed`) pour les toasts. Fournit une région stable pour les
 * annonces AT. Pas de logique de file ou de timer — c'est une primitive de présentation.
 *
 * @example
 * <ToastRegion position="top-right">…</ToastRegion>
 */
export const ToastRegion = forwardRef<HTMLDivElement, ToastRegionProps>(function ToastRegion(
  { position = 'bottom-right', className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      aria-label="Notifications"
      className={mergeClassNames(
        'enistere-toast-region',
        `enistere-toast-region--${position}`,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
