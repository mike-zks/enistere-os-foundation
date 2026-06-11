/**
 * Fallback screen for unknown routes (spec §16).
 */
import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { ROUTES } from '@/navigation';
import { useTheme } from '@/theme';
import { Screen, Text } from '@/ui';

export default function NotFoundScreen(): React.JSX.Element {
  const theme = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <Screen centered>
        <View style={{ gap: theme.spacing.md, alignItems: 'center' }}>
          <Text variant="heading">Page not found</Text>
          <Link href={ROUTES.signIn}>
            <Text variant="body" tone="primary">
              Go to the start screen
            </Text>
          </Link>
        </View>
      </Screen>
    </>
  );
}
