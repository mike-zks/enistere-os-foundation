/**
 * Public sign-in screen — generic email/password form (RN 32).
 *
 * Uses RHF + Zod via existing RN 3 primitives for UX validation. Client
 * validation is for UX only — the starter NestJS remains the validation
 * authority (ADR-003 §18). No credentials stored or logged. No business
 * onboarding or registration logic (spec §17).
 */
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/features/auth';
import { TextInputField, createZodResolver, emailField, requiredText } from '@/forms';
import { useTheme } from '@/theme';
import { Button, Screen, Text } from '@/ui';

const signInSchema = z.object({
  email: emailField(),
  password: requiredText(),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function SignInScreen(): React.JSX.Element {
  const { signIn, status, error } = useAuth();
  const theme = useTheme();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: createZodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: SignInFormValues): Promise<void> => {
    await signIn({ email: values.email, password: values.password });
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
        <View style={styles.form}>
          <TextInputField
            control={control}
            name="email"
            label="Email"
            required
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            placeholder="you@example.com"
            returnKeyType="next"
          />
          <TextInputField
            control={control}
            name="password"
            label="Password"
            required
            secureTextEntry
            textContentType="password"
            returnKeyType="send"
            onSubmitEditing={() => void handleSubmit(onSubmit)()}
          />
        </View>
        {error != null && status !== 'expired' ? (
          <Text
            variant="caption"
            tone="danger"
            accessibilityRole="alert"
            style={{ textAlign: 'center' }}
          >
            Sign-in failed. Please check your credentials and try again.
          </Text>
        ) : null}
        <Button
          title="Sign in"
          loading={isSubmitting}
          onPress={() => void handleSubmit(onSubmit)()}
        />
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
  form: {
    alignSelf: 'stretch',
  },
});
