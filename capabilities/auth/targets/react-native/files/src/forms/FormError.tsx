/**
 * FormError — themed, accessible field error message (ADR-010 §16, spec §45:
 * "erreurs de formulaire accessibles").
 *
 * Renders nothing when there is no message. When present it is danger-toned and
 * exposed as a polite live region so assistive tech announces the change.
 */
import { useTheme } from '../theme';
import { Text } from '../ui';

export interface FormErrorProps {
  /** The message to show; when empty/undefined the component renders `null`. */
  readonly message?: string;
  /** `nativeID` so a control can reference it (e.g. `aria-describedby`). */
  readonly nativeID?: string;
}

export function FormError({ message, nativeID }: FormErrorProps): React.JSX.Element | null {
  const theme = useTheme();
  if (!message) {
    return null;
  }
  return (
    <Text
      nativeID={nativeID}
      variant="caption"
      tone="danger"
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
      style={{ marginTop: theme.spacing.xs }}
    >
      {message}
    </Text>
  );
}
