/**
 * Public navigation stack. Authenticated users are bounced to the app stack
 * (defense in depth alongside `app/index.tsx`).
 */
import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/auth';
import { ROUTES } from '@/navigation';

export default function PublicLayout(): React.JSX.Element {
  const { status } = useAuth();

  if (status === 'authenticated') {
    return <Redirect href={ROUTES.home} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
