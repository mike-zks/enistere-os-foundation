/**
 * Upload diagnostics screen — closes B1 (RN36).
 *
 * Generic upload smoke surface: selects a category via RHF/Zod, sends a
 * hardcoded fixture file through useUploadMutation (official client, 401 bridge),
 * and renders loading / success / error states. No business logic, no picker,
 * no file URI / server payload in logs or state (ADR-007/015).
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import type { FileCategory } from '@enistere/api-client-fetch';
import { ErrorState, LoadingState, MessageState } from '@/states';
import { useTheme } from '@/theme';
import { Button, Screen, Text } from '@/ui';
import { useUploadMutation } from '@/upload';
import type { MobileFile } from '@/upload';

const FILE_CATEGORIES = [
  'DOCUMENT',
  'IMAGE',
  'ATTACHMENT',
  'MEDIA',
  'AUDIO',
  'VIDEO',
  'OTHER',
] as const satisfies readonly FileCategory[];

const uploadSchema = z.object({
  category: z.enum(FILE_CATEGORIES),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

const SMOKE_FIXTURE: MobileFile = {
  uri: 'file:///sdcard/Download/enistere-smoke.txt',
  name: 'smoke-diagnostic.txt',
  type: 'text/plain',
};

export default function UploadScreen(): React.JSX.Element {
  const theme = useTheme();
  const upload = useUploadMutation();

  const { control, handleSubmit } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { category: 'DOCUMENT' },
  });

  function onSubmit(values: UploadFormValues) {
    upload.mutate({ file: SMOKE_FIXTURE, category: values.category });
  }

  if (upload.isPending) {
    return (
      <>
        <Stack.Screen options={{ title: 'Upload diagnostics' }} />
        <Screen centered>
          <LoadingState />
        </Screen>
      </>
    );
  }

  if (upload.isSuccess) {
    return (
      <>
        <Stack.Screen options={{ title: 'Upload diagnostics' }} />
        <Screen centered>
          <MessageState
            title="Upload complete"
            description={`Category: ${upload.variables?.category ?? '—'}`}
            action={{ label: 'Reset', onPress: upload.reset }}
          />
        </Screen>
      </>
    );
  }

  if (upload.isError) {
    return (
      <>
        <Stack.Screen options={{ title: 'Upload diagnostics' }} />
        <Screen centered>
          <ErrorState
            title="Upload failed"
            description="An error occurred. Ensure the mock server handles POST /files and the fixture file exists on device."
            onRetry={upload.reset}
          />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Upload diagnostics' }} />
      <Screen>
        <ScrollView
          contentContainerStyle={[styles.container, { gap: theme.spacing.md, paddingBottom: theme.spacing.xl }]}
        >
          <Text variant="heading">Upload diagnostics</Text>
          <Text variant="body" tone="muted">
            Generic upload smoke — no picker, no business logic. Uses a local fixture file.
          </Text>
          <Text variant="title">Category</Text>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <View style={{ gap: theme.spacing.sm }}>
                {FILE_CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    title={cat}
                    variant={field.value === cat ? 'primary' : 'secondary'}
                    onPress={() => field.onChange(cat)}
                  />
                ))}
              </View>
            )}
          />
          <Button
            title="Submit diagnostic upload"
            onPress={() => void handleSubmit(onSubmit)()}
          />
        </ScrollView>
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
