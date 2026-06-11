/**
 * Entry gate — redirects to the public or authenticated stack based on auth
 * state, showing a loading state while the session is being restored (spec §16).
 */
import { Redirect } from 'expo-router';

import { useAuth } from '@/auth';
import { ROUTES } from '@/navigation';
import { LoadingState } from '@/states';
import { Screen } from '@/ui';

export default function Index(): React.JSX.Element {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <Screen>
        <LoadingState message="Restoring session…" />
      </Screen>
    );
  }

  return <Redirect href={status === 'authenticated' ? ROUTES.home : ROUTES.signIn} />;
}
