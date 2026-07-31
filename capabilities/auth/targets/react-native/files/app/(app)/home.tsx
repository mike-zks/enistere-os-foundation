/**
 * Authenticated placeholder screen. Shows the (generic) session and a sign-out
 * action. NO business content (spec §6).
 */
import { Stack, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { CAPABILITY_HOME_ACTIONS } from '@/composition/home-actions';
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
        <View style={[styles.container, { gap: theme.spacing.md }]}>
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
          {CAPABILITY_HOME_ACTIONS.map((action) => (
            <Button
              key={String(action.href)}
              title={action.label}
              variant="secondary"
              onPress={() => router.push(action.href)}
            />
          ))}
          <Button title="Sign out" variant="secondary" onPress={() => void signOut()} />
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 560,
    width: '100%',
  },
});
