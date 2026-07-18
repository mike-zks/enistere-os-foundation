/**
 * Fixture de COMPILATION (non exécutée) — consommateur React générique, compatible avec un futur
 * Web Core Next.js SANS importer Next. En production :
 *   import { Button, Dialog, Select, Toast, ToastRegion, … } from '@enistere/ui-kit';
 *   import '@enistere/ui-kit/styles.css';
 * (ici on importe la source pour rester robuste au build ; le CSS s'importe côté application.)
 */
import { createRef, useState } from 'react';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Divider,
  EmptyState,
  ErrorState,
  Input,
  Label,
  LoadingState,
  Select,
  Skeleton,
  Spinner,
  SuccessState,
  Text,
  Toast,
  ToastRegion,
  VisuallyHidden,
  type BadgeVariant,
  type ButtonProps,
  type DividerOrientation,
  type EmptyStateProps,
  type ErrorStateProps,
  type LoadingStateProps,
  type SelectSize,
  type SkeletonVariant,
  type SuccessStateProps,
  type TextElement,
  type ToastRegionPosition,
  type ToastVariant,
} from '../../src/index.js';

export function DemoForm() {
  const buttonRef = createRef<HTMLButtonElement>();
  const inputRef = createRef<HTMLInputElement>();
  const selectRef = createRef<HTMLSelectElement>();
  const variant: ButtonProps['variant'] = 'primary';
  const titleAs: TextElement = 'h1';
  const selectSize: SelectSize = 'md';
  const badgeVariant: BadgeVariant = 'success';
  const dividerOrientation: DividerOrientation = 'horizontal';
  const skeletonVariant: SkeletonVariant = 'text';
  const [open, setOpen] = useState(false);
  const toastVariant: ToastVariant = 'success';
  const toastPos: ToastRegionPosition = 'bottom-right';
  const loadingProps: LoadingStateProps = { message: 'Chargement…' };
  const emptyProps: EmptyStateProps = { title: 'Aucun résultat' };
  const errorProps: ErrorStateProps = { title: 'Erreur' };
  const successProps: SuccessStateProps = { title: 'Succès' };

  return (
    <section>
      <Text as={titleAs} variant="display">
        Connexion
      </Text>
      <Label htmlFor="email" required>
        Email
      </Label>
      <Input ref={inputRef} id="email" type="email" placeholder="jean@example.com" />
      <Label htmlFor="country" required>
        Pays
      </Label>
      <Select ref={selectRef} id="country" size={selectSize}>
        <option value="">— choisir —</option>
        <option value="ci">Côte d&apos;Ivoire</option>
      </Select>
      <Button ref={buttonRef} variant={variant} size="md" className="app-cta" onClick={() => setOpen(true)}>
        Ouvrir dialog
      </Button>
      <Button variant="danger" loading loadingText="Suppression…">
        Supprimer
      </Button>
      <Spinner label="Chargement…" />
      <VisuallyHidden>Texte pour lecteur d&apos;écran</VisuallyHidden>

      <Badge variant={badgeVariant}>Actif</Badge>
      <Divider orientation={dividerOrientation} />
      <Divider label="OU" />
      <Skeleton variant={skeletonVariant} style={{ width: '120px' }} />

      <Dialog open={open} onDismiss={() => setOpen(false)} aria-labelledby="dlg-title">
        <DialogHeader>
          <DialogTitle id="dlg-title">Confirmer</DialogTitle>
        </DialogHeader>
        <DialogContent>Êtes-vous sûr ?</DialogContent>
        <DialogFooter>
          <Button variant="primary">Confirmer</Button>
          <Button variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
        </DialogFooter>
      </Dialog>

      <ToastRegion position={toastPos}>
        <Toast variant={toastVariant} title="Succès" onDismiss={() => {}}>
          Opération réussie.
        </Toast>
      </ToastRegion>

      <LoadingState {...loadingProps} />
      <EmptyState {...emptyProps} description="Essayez un autre filtre." action={<button>Créer</button>} />
      <ErrorState {...errorProps} message="Veuillez réessayer." action={<button>Réessayer</button>} />
      <SuccessState {...successProps} message="Enregistré." action={<button>Continuer</button>} />
    </section>
  );
}
