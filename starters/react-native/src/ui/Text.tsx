/**
 * Text — themed text primitive. Variants map to typography tokens; tone maps to
 * semantic colors. No magic values (ADR-010 §19).
 */
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '../theme';
import type { TypographyVariant } from '../theme';

type TextTone = 'default' | 'muted' | 'primary' | 'danger' | 'success' | 'onPrimary';

export interface TextProps extends RNTextProps {
  readonly variant?: TypographyVariant;
  readonly tone?: TextTone;
}

export function Text({
  variant = 'body',
  tone = 'default',
  style,
  ...rest
}: TextProps): React.JSX.Element {
  const theme = useTheme();
  const typo = theme.typography[variant];
  const color = toneColor(theme.colors, tone);
  return (
    <RNText
      style={[
        {
          color,
          fontSize: typo.fontSize,
          lineHeight: typo.lineHeight,
          fontWeight: typo.fontWeight,
        },
        style,
      ]}
      {...rest}
    />
  );
}

function toneColor(colors: ReturnType<typeof useTheme>['colors'], tone: TextTone): string {
  switch (tone) {
    case 'muted':
      return colors.textMuted;
    case 'primary':
      return colors.primary;
    case 'danger':
      return colors.danger;
    case 'success':
      return colors.success;
    case 'onPrimary':
      return colors.primaryText;
    default:
      return colors.text;
  }
}
