/**
 * Écran d'accueil de la baseline `base`. Surface générique du socle : aucun
 * contenu métier, aucune session, aucun réseau. La capability Auth composée
 * REMPLACE cet écran par la porte d'entrée (redirection publique/protégée selon
 * l'état de session) via son overlay.
 */
import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { Screen, Text } from '@/ui';

const FOUNDATION_DIAGNOSTICS = [
  ['theme', 'ready'],
  ['query', 'ready'],
  ['logger', 'ready'],
  ['i18n', 'ready'],
  ['retry', 'available'],
  ['consent', 'placeholder'],
  ['telemetry coordinator', 'opt-in'],
] as const;

export default function IndexScreen(): React.JSX.Element {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Foundation' }} />
      <Screen>
        <View style={[styles.container, { gap: theme.spacing.md }]}>
          <Text variant="heading">Enistère — Mobile Core</Text>
          <Text variant="body" tone="muted">
            Baseline générique (Expo Router). Les capabilities (Auth, Files) se composent
            par-dessus via la Factory. Aucun contenu métier ici.
          </Text>
          <View
            style={[
              styles.card,
              {
                gap: theme.spacing.sm,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
              },
            ]}
          >
            <Text variant="title">Diagnostics du socle</Text>
            {FOUNDATION_DIAGNOSTICS.map(([label, value]) => (
              <View key={label} style={styles.row}>
                <Text variant="body">{label}</Text>
                <Text variant="body" tone="muted">
                  {value}
                </Text>
              </View>
            ))}
          </View>
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
  card: {
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
