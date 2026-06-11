/**
 * Screen — safe-area-aware page container with themed background and padding.
 * Centers content optionally (handy for the placeholder/state screens).
 */
import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../theme';

export interface ScreenProps extends PropsWithChildren {
  /** Center children vertically + horizontally. */
  readonly centered?: boolean;
  readonly style?: ViewStyle;
}

export function Screen({ centered = false, style, children }: ScreenProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.content,
          { padding: theme.spacing.lg },
          centered && styles.centered,
          style,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
