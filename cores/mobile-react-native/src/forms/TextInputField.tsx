/**
 * TextInputField — a themed text input bound to React Hook Form.
 *
 * Wraps RHF's `Controller` and renders a token-driven `TextInput` inside a
 * {@link FormField} (label + error). Border tone reflects focus and validity
 * (ADR-010 §19 states). Generic over the form's value shape; no business logic.
 */
import { useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { useTheme } from '../theme';
import { fieldErrorMessage } from './form-errors';
import { FormField } from './FormField';

export interface TextInputFieldProps<TFieldValues extends FieldValues>
  extends Omit<TextInputProps, 'value' | 'onChangeText' | 'onChange' | 'onBlur' | 'style'> {
  readonly control: Control<TFieldValues>;
  readonly name: FieldPath<TFieldValues>;
  readonly label?: string;
  readonly hint?: string;
  readonly required?: boolean;
  readonly style?: TextInputProps['style'];
}

export function TextInputField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  hint,
  required = false,
  style,
  ...inputProps
}: TextInputFieldProps<TFieldValues>): React.JSX.Element {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const fieldId = `field-${name}`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const error = fieldErrorMessage(fieldState.error);
        const borderColor = error
          ? theme.colors.danger
          : focused
            ? theme.colors.primary
            : theme.colors.border;
        const value = field.value == null ? '' : String(field.value);
        return (
          <FormField fieldId={fieldId} label={label} required={required} hint={hint} error={error}>
            <TextInput
              {...inputProps}
              accessibilityLabel={label ?? name}
              placeholderTextColor={theme.colors.textMuted}
              value={value}
              onChangeText={field.onChange}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                field.onBlur();
              }}
              style={[
                styles.input,
                {
                  minHeight: theme.a11y.minTouchTarget,
                  borderColor,
                  borderRadius: theme.radius.md,
                  paddingHorizontal: theme.spacing.md,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surfaceElevated,
                },
                style,
              ]}
            />
          </FormField>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    fontSize: 16,
  },
});
