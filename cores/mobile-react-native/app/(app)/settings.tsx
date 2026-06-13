/**
 * Generic protected settings screen (RN 26).
 *
 * V1 starter shell surface only: session controls, UI preference reset,
 * placeholder privacy/environment diagnostics and foundation capability status.
 * No business content, no network calls, no persistence, no SDK wiring.
 */
import { Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { createPlaceholderAppEnvironmentAdapter, createAppEnvironmentService } from '@/app-environment';
import { CONSENT_CATEGORIES, createConsentService, createPlaceholderConsentStore } from '@/consent';
import type { ConsentCategory, ConsentStatus } from '@/consent';
import { useAuth } from '@/auth';
import { useUiStore } from '@/store/ui-store';
import { useTheme } from '@/theme';
import { Button, Screen, Text } from '@/ui';

type ConsentStatusMap = Readonly<Record<ConsentCategory, ConsentStatus>>;

const FOUNDATION_DIAGNOSTICS = [
  ['auth', 'ready'],
  ['query', 'ready'],
  ['upload', 'ready'],
  ['logger', 'ready'],
  ['consent', 'placeholder'],
  ['telemetry coordinator', 'opt-in'],
  ['retry', 'available'],
] as const;

export default function SettingsScreen(): React.JSX.Element {
  const { session, status, refreshSession, signOut } = useAuth();
  const theme = useTheme();
  const themePreference = useUiStore((state) => state.themePreference);
  const resetUiState = useUiStore((state) => state.reset);
  const [consentStatuses, setConsentStatuses] = useState<ConsentStatusMap>(() => emptyConsentStatuses());

  const consent = useMemo(
    () => createConsentService({ store: createPlaceholderConsentStore() }),
    [],
  );
  const environment = useMemo(
    () =>
      createAppEnvironmentService({
        adapter: createPlaceholderAppEnvironmentAdapter({
          os: 'unknown',
          appVersion: 'starter',
          buildChannel: 'foundation',
          environment: 'local',
        }),
      }),
    [],
  );
  const environmentContext = environment.describeForContext();

  useEffect(() => {
    let active = true;
    void Promise.all(CONSENT_CATEGORIES.map(async (category) => [category, await consent.get(category)] as const))
      .then((entries) => {
        if (active) {
          setConsentStatuses(Object.freeze(Object.fromEntries(entries)) as ConsentStatusMap);
        }
      });
    return () => {
      active = false;
    };
  }, [consent]);

  const expiresLabel =
    session?.expiresAt != null ? new Date(session.expiresAt).toLocaleString() : 'unavailable';

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <Screen>
        <ScrollView contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: theme.spacing.xl }}>
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="heading">Settings</Text>
            <Text variant="body" tone="muted">
              Generic starter controls and foundation diagnostics.
            </Text>
          </View>

          <Section title="Session">
            <Row label="Status" value={status} />
            <Row label="User" value={session?.user?.displayName ?? 'not available'} />
            <Row label="Expires" value={expiresLabel} />
            <Button
              title="Refresh session"
              variant="secondary"
              loading={status === 'refreshing'}
              onPress={() => void refreshSession()}
            />
            <Button title="Sign out" variant="secondary" onPress={() => void signOut()} />
          </Section>

          <Section title="Preferences / UI">
            <Row label="Theme preference" value={themePreference} />
            <Button title="Reset UI state" variant="secondary" onPress={resetUiState} />
          </Section>

          <Section title="Privacy / Telemetry">
            {CONSENT_CATEGORIES.map((category) => (
              <Row key={category} label={category} value={consentStatuses[category]} />
            ))}
            <Text variant="caption" tone="muted">
              Placeholder consent only. No global telemetry wiring or SDK is started here.
            </Text>
          </Section>

          <Section title="Environment">
            {Object.entries(environmentContext).map(([key, value]) => (
              <Row key={key} label={key} value={String(value)} />
            ))}
            <Text variant="caption" tone="muted">
              Safe RN22 context only; no device identifier is collected.
            </Text>
          </Section>

          <Section title="Foundation diagnostics">
            {FOUNDATION_DIAGNOSTICS.map(([label, value]) => (
              <Row key={label} label={label} value={value} />
            ))}
          </Section>
        </ScrollView>
      </Screen>
    </>
  );
}

function emptyConsentStatuses(): ConsentStatusMap {
  return Object.freeze({
    analytics: 'unknown',
    crash: 'unknown',
    performance: 'unknown',
    diagnostics: 'unknown',
  });
}

function Section({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text variant="title">{title}</Text>
      <View
        style={[
          styles.section,
          {
            gap: theme.spacing.sm,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Row({ label, value }: { readonly label: string; readonly value: string }): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={[styles.row, { gap: theme.spacing.md }]}>
      <Text variant="body" style={styles.rowLabel}>
        {label}
      </Text>
      <Text variant="body" tone="muted" style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderWidth: 1,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    flex: 1,
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
  },
});
