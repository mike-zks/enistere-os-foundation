/**
 * LoadingState — standard initial/loading placeholder (spec §26).
 */
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { Text } from '../ui';

export interface LoadingStateProps {
  readonly message?: string;
}

export function LoadingState({ message }: LoadingStateProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={[styles.container, { gap: theme.spacing.md }]}>
      <ActivityIndicator color={theme.colors.primary} />
      {message ? (
        <Text variant="body" tone="muted">
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
