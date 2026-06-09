/**
 * Fixture de COMPILATION (non exécutée) — consommateur React générique, compatible avec un futur
 * Web Core Next.js SANS importer Next. En production :
 *   import { Button, Input, Label, Text, Spinner } from '@enistere/ui-kit';
 *   import '@enistere/ui-kit/styles.css';
 * (ici on importe la source pour rester robuste au build ; le CSS s'importe côté application.)
 */
import { createRef } from 'react';

import {
  Button,
  Input,
  Label,
  Spinner,
  Text,
  VisuallyHidden,
  type ButtonProps,
  type TextElement,
} from '../../src/index.js';

export function DemoForm() {
  const buttonRef = createRef<HTMLButtonElement>();
  const inputRef = createRef<HTMLInputElement>();
  const variant: ButtonProps['variant'] = 'primary';
  const titleAs: TextElement = 'h1';

  return (
    <section>
      <Text as={titleAs} variant="display">
        Connexion
      </Text>
      <Label htmlFor="email" required>
        Email
      </Label>
      <Input ref={inputRef} id="email" type="email" placeholder="jean@example.com" />
      <Button ref={buttonRef} variant={variant} size="md" className="app-cta">
        Enregistrer
      </Button>
      <Button variant="danger" loading loadingText="Suppression…">
        Supprimer
      </Button>
      <Spinner label="Chargement…" />
      <VisuallyHidden>Texte pour lecteur d&apos;écran</VisuallyHidden>
    </section>
  );
}
