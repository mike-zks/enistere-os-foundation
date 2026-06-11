/**
 * Root layout — mounts the global providers and the navigator.
 *
 * Provider order: SafeAreaProvider → ThemeProvider (ADR-010) → QueryProvider
 * (ADR-012) → AuthProvider (ADR-004/015). The auth-based routing decisions live
 * in `app/index.tsx` and the group layouts.
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/auth';
import { QueryProvider } from '@/query';
import { ThemeProvider } from '@/theme';

export default function RootLayout(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryProvider>
          <AuthProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }} />
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
