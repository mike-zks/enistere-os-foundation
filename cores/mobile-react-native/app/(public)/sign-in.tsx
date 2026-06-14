/**
 * Public placeholder screen. Demonstrates a generic sign-in via the official
 * client (real `/auth/login`); without a reachable API it surfaces an error.
 * Strictly generic — NO business onboarding/registration workflow (spec §17).
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth';
import { useTheme } from '@/theme';
import { Button, Screen, Text } from '@/ui';

export default function SignInScreen(): React.JSX.Element {
  const { signIn, status, error } = useAuth();
  const theme = useTheme();
  const [submitting, setSubmitting] = useState(false);

  const onSignIn = async (): Promise<void> => {
    setSubmitting(true);
    try {
      await signIn({ email: 'demo@example.com', password: 'demo' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen centered>
      <View style={[styles.container, { gap: theme.spacing.md }]}>
        <Text variant="heading">Enistere Mobile Starter</Text>
        <Text variant="body" tone="muted" style={{ textAlign: 'center' }}>
          Public placeholder screen. This is a generic foundation — no business logic.
        </Text>
        {status === 'expired' ? (
          <Text variant="body" tone="danger" style={{ textAlign: 'center' }}>
            Your session expired. Please sign in again.
          </Text>
        ) : null}
        <Button title="Sign in" loading={submitting} onPress={() => void onSignIn()} />
        {error && status !== 'expired' ? (
          <Text variant="caption" tone="danger">
            {error}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
  },
});
