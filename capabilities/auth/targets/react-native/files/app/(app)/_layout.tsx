/**
 * Authenticated (protected) navigation stack — the route guard (spec §16/§17).
 *
 * - loading      → show a loading state (session restoring);
 * - unauthenticated / expired → redirect to the public sign-in;
 * - authenticated → render the protected stack.
 */
import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/features/auth';
import { ROUTES, isAuthBusy } from '@/features/auth/navigation';
import { LoadingState } from '@/states';
import { Screen } from '@/ui';

export default function AppLayout(): React.JSX.Element {
  const { status } = useAuth();

  // Restoring or refreshing → keep the user on a loading screen, don't bounce.
  if (isAuthBusy(status)) {
    return (
      <Screen>
        <LoadingState message={status === 'refreshing' ? 'Refreshing session…' : undefined} />
      </Screen>
    );
  }

  // unauthenticated / expired → back to the public stack (expired shows a notice there).
  if (status !== 'authenticated') {
    return <Redirect href={ROUTES.signIn} />;
  }

  return <Stack screenOptions={{ headerShown: true }} />;
}
