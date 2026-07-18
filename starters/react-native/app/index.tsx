/**
 * Entry gate — redirects to the public or authenticated stack based on auth
 * state, showing a loading state while the session is being restored (spec §16).
 */
import { Redirect } from 'expo-router';

import { useAuth } from '@/auth';
import { ROUTES, isAuthBusy } from '@/navigation';
import { LoadingState } from '@/states';
import { Screen } from '@/ui';

export default function Index(): React.JSX.Element {
  const { status } = useAuth();

  if (isAuthBusy(status)) {
    return (
      <Screen>
        <LoadingState message="Restoring session…" />
      </Screen>
    );
  }

  // authenticated → app; unauthenticated/expired → public sign-in.
  return <Redirect href={status === 'authenticated' ? ROUTES.home : ROUTES.signIn} />;
}
