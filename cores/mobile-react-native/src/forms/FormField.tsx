/**
 * FormField — generic field layout: label + control + (hint | error).
 *
 * A presentational wrapper that composes {@link FormLabel} and {@link FormError}
 * around an arbitrary control (`children`). It owns the `nativeID` wiring so the
 * control can be associated with its label and error for accessibility. It holds
 * NO form state and NO business logic — bind state with `TextInputField` (RHF)
 * or by passing `error` directly.
 */
import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { useTheme } from '../theme';
import { Text } from '../ui';
import { FormError } from './FormError';
import { FormLabel } from './FormLabel';

export interface FormFieldProps extends PropsWithChildren {
  /** Stable id base; derives `${fieldId}-label` / `${fieldId}-error` nativeIDs. */
  readonly fieldId: string;
  readonly label?: string;
  readonly required?: boolean;
  /** Helper text shown when there is no error. */
  readonly hint?: string;
  /** Current error message, if any. */
  readonly error?: string;
}

export function FormField({
  fieldId,
  label,
  required = false,
  hint,
  error,
  children,
}: FormFieldProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: theme.spacing.md }}>
      {label ? (
        <FormLabel nativeID={`${fieldId}-label`} required={required}>
          {label}
        </FormLabel>
      ) : null}
      {children}
      {error ? (
        <FormError nativeID={`${fieldId}-error`} message={error} />
      ) : hint ? (
        <Text
          nativeID={`${fieldId}-hint`}
          variant="caption"
          tone="muted"
          style={{ marginTop: theme.spacing.xs }}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
