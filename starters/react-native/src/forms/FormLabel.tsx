/**
 * FormLabel — themed, accessible field label (ADR-008/010).
 *
 * Token-driven (no magic values). When `required`, a danger-toned asterisk is
 * shown and folded into the accessible label so screen readers announce it.
 */
import { useTheme } from '../theme';
import { Text } from '../ui';

export interface FormLabelProps {
  readonly children: string;
  /** `nativeID` so a control can reference it (e.g. `aria-labelledby`). */
  readonly nativeID?: string;
  readonly required?: boolean;
}

export function FormLabel({ children, nativeID, required = false }: FormLabelProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <Text
      nativeID={nativeID}
      variant="caption"
      tone="muted"
      accessibilityRole="text"
      accessibilityLabel={required ? `${children}, required` : children}
      style={{ marginBottom: theme.spacing.xs }}
    >
      {children}
      {required ? <Text tone="danger" variant="caption">{' *'}</Text> : null}
    </Text>
  );
}
