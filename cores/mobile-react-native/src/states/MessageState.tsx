/**
 * MessageState — shared layout for the centered title/description/action states
 * (error, empty, offline, unauthorized). Keeps those variants DRY.
 */
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme';
import { Button, Text } from '../ui';

export interface MessageStateAction {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: 'primary' | 'secondary' | 'danger';
}

export interface MessageStateProps {
  readonly title: string;
  readonly description?: string;
  readonly tone?: 'default' | 'danger';
  readonly action?: MessageStateAction;
}

export function MessageState({
  title,
  description,
  tone = 'default',
  action,
}: MessageStateProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={[styles.container, { gap: theme.spacing.sm, padding: theme.spacing.lg }]}>
      <Text variant="title" tone={tone === 'danger' ? 'danger' : 'default'} style={styles.center}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" tone="muted" style={styles.center}>
          {description}
        </Text>
      ) : null}
      {action ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <Button title={action.label} variant={action.variant ?? 'primary'} onPress={action.onPress} />
        </View>
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
  center: {
    textAlign: 'center',
  },
});
