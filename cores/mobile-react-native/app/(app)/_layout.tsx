/**
 * Authenticated (protected) navigation stack — the route guard (spec §16/§17).
 *
 * - loading      → show a loading state (session restoring);
 * - unauthenticated / expired → redirect to the public sign-in;
 * - authenticated → render the protected stack.
 */
import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/auth';
import { ROUTES } from '@/navigation';
import { LoadingState } from '@/states';
import { Screen } from '@/ui';

export default function AppLayout(): React.JSX.Element {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (status !== 'authenticated') {
    return <Redirect href={ROUTES.signIn} />;
  }

  return <Stack screenOptions={{ headerShown: true }} />;
}
