/**
 * Authenticated placeholder screen. Shows the (generic) session and a sign-out
 * action. NO business content (spec §6).
 */
import { Stack } from 'expo-router';
import { View } from 'react-native';

import { useAuth } from '@/auth';
import { useTheme } from '@/theme';
import { Button, Screen, Text } from '@/ui';

export default function HomeScreen(): React.JSX.Element {
  const { session, signOut } = useAuth();
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <Screen>
        <View style={{ gap: theme.spacing.md }}>
          <Text variant="heading">Home</Text>
          <Text variant="body" tone="muted">
            Authenticated placeholder screen. This is a generic foundation — no business logic.
          </Text>
          <Text variant="caption" tone="muted">
            session user: {session?.user?.displayName ?? '—'}
          </Text>
          <Button title="Sign out" variant="secondary" onPress={() => void signOut()} />
        </View>
      </Screen>
    </>
  );
}
