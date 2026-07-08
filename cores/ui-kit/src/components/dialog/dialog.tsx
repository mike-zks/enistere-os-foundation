import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactElement } from 'react';

import { mergeClassNames } from '../../utilities/merge-class-names.js';
import type {
  DialogDescriptionProps,
  DialogProps,
  DialogSectionProps,
  DialogTitleProps,
} from './dialog.types.js';

/**
 * Boîte de dialogue modale native (`<dialog>`). Focus trap, gestion ESC et backdrop fournis
 * nativement par `showModal()`. **Pas de Radix/Portal** — la primitive reste simple et accessible.
 *
 * Le consommateur gère l'état ouvert (`open`) et le dismiss (`onDismiss`). L'association
 * accessibilité titre/description se fait via `aria-labelledby` / `aria-describedby` sur le `Dialog`
 * et les `id` des sous-composants (`DialogTitle`, `DialogDescription`).
 *
 * @example
 * <Dialog open={open} onDismiss={() => setOpen(false)} aria-labelledby="dlg-title">
 *   <DialogHeader>
 *     <DialogTitle id="dlg-title">Confirmer la suppression</DialogTitle>
 *   </DialogHeader>
 *   <DialogContent>Êtes-vous sûr ?</DialogContent>
 *   <DialogFooter>
 *     <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
 *     <Button variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
 *   </DialogFooter>
 * </Dialog>
 */
export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(function Dialog(
  { open, onDismiss, className, children, ...rest },
  forwardedRef,
) {
  const ref = useRef<HTMLDialogElement>(null);
  useImperativeHandle(forwardedRef, () => ref.current as HTMLDialogElement, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Guard pour les environnements sans <dialog> natif (jsdom, SSR partiel).
    const nativeDialog = el as HTMLElement & { open?: boolean; showModal?(): void; close?(): void };
    if (open) {
      if (!nativeDialog.open && typeof nativeDialog.showModal === 'function') nativeDialog.showModal();
    } else {
      if (nativeDialog.open && typeof nativeDialog.close === 'function') nativeDialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={mergeClassNames('enistere-dialog', className)}
      aria-modal="true"
      {...rest}
      onCancel={(e) => {
        e.preventDefault();
        onDismiss?.();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss?.();
      }}
    >
      <div className="enistere-dialog__panel">{children}</div>
    </dialog>
  );
});

export const DialogHeader = forwardRef<HTMLDivElement, DialogSectionProps>(function DialogHeader(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={mergeClassNames('enistere-dialog__header', className)} {...rest} />;
});

/** Titre de la boîte de dialogue. `h2` par défaut — adapter selon la hiérarchie du document. */
export function DialogTitle({ as: As = 'h2', className, ...rest }: DialogTitleProps): ReactElement {
  return <As className={mergeClassNames('enistere-dialog__title', className)} {...rest} />;
}

export function DialogDescription({ className, ...rest }: DialogDescriptionProps): ReactElement {
  return <p className={mergeClassNames('enistere-dialog__description', className)} {...rest} />;
}

export const DialogContent = forwardRef<HTMLDivElement, DialogSectionProps>(function DialogContent(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={mergeClassNames('enistere-dialog__content', className)} {...rest} />;
});

export const DialogFooter = forwardRef<HTMLDivElement, DialogSectionProps>(function DialogFooter(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={mergeClassNames('enistere-dialog__footer', className)} {...rest} />;
});
