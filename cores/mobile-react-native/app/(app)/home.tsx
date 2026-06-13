/**
 * Authenticated placeholder screen. Shows the (generic) session and a sign-out
 * action. NO business content (spec §6).
 */
import { Stack, router } from 'expo-router';
import { View } from 'react-native';

import { useAuth } from '@/auth';
import { ROUTES } from '@/navigation';
import { useTheme } from '@/theme';
import { Button, Screen, Text } from '@/ui';

export default function HomeScreen(): React.JSX.Element {
  const { session, status, signOut, refreshSession } = useAuth();
  const theme = useTheme();

  const expiresLabel =
    session?.expiresAt != null ? new Date(session.expiresAt).toLocaleTimeString() : '—';

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
            session user: {session?.user?.displayName ?? '—'} · expires: {expiresLabel}
          </Text>
          <Button
            title="Refresh session"
            variant="secondary"
            loading={status === 'refreshing'}
            onPress={() => void refreshSession()}
          />
          <Button
            title="Open settings"
            variant="secondary"
            onPress={() => router.push(ROUTES.settings)}
          />
          <Button title="Sign out" variant="secondary" onPress={() => void signOut()} />
        </View>
      </Screen>
    </>
  );
}
