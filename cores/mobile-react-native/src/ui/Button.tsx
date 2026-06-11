/**
 * Button — themed pressable. Covers the interactive states required by
 * ADR-010 §19 (pressed, disabled, loading) and enforces the minimum touch
 * target (a11y token). Generic only — no business behaviour.
 */
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { useTheme } from '../theme';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  readonly title: string;
  readonly variant?: ButtonVariant;
  readonly loading?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  ...rest
}: ButtonProps): React.JSX.Element {
  const theme = useTheme();
  const isDisabled = disabled === true || loading;
  const bg = backgroundFor(theme.colors, variant);
  const labelTone = variant === 'secondary' ? 'default' : 'onPrimary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: theme.a11y.minTouchTarget,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
          backgroundColor: bg,
          borderColor: variant === 'secondary' ? theme.colors.border : bg,
        },
        variant === 'secondary' && styles.outlined,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
      {...rest}
    >
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator
            color={variant === 'secondary' ? theme.colors.text : theme.colors.primaryText}
          />
        ) : (
          <Text variant="title" tone={labelTone}>
            {title}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function backgroundFor(
  colors: ReturnType<typeof useTheme>['colors'],
  variant: ButtonVariant,
): string {
  switch (variant) {
    case 'secondary':
      return colors.surface;
    case 'danger':
      return colors.danger;
    default:
      return colors.primary;
  }
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  outlined: {
    borderWidth: 1,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
