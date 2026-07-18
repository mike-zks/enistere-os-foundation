/**
 * Root layout — monte les providers globaux et le navigateur.
 *
 * Ordre des providers : SafeAreaProvider → ThemePreferenceProvider (ADR-010) →
 * QueryProvider (ADR-012) → CapabilityProviders. `CapabilityProviders` est le
 * point d'intégration généré par la Factory : la baseline `base` n'y monte aucun
 * provider ; la capability Auth composée y insère son `AuthProvider` (ADR-004/015)
 * via l'intégration `expo.provider`, sans modifier ce layout.
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CapabilityProviders } from '@/composition/capability-providers';
import { QueryProvider } from '@/query';
import { ThemePreferenceProvider } from '@/theme';

export default function RootLayout(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemePreferenceProvider>
        <QueryProvider>
          <CapabilityProviders>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }} />
          </CapabilityProviders>
        </QueryProvider>
      </ThemePreferenceProvider>
    </SafeAreaProvider>
  );
}
