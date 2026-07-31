/**
 * TanStack Query client factory + default singleton du runtime neutre.
 *
 * Defaults are conservative and mobile-friendly. No business queries or query
 * keys live here. Retry is a bounded policy, plus whatever exceptions the
 * composed capabilities declare through `CAPABILITY_RETRY_GUARDS` — Auth uses it
 * so a 401 is never retried, because it needs a re-auth and not another attempt.
 */
import { QueryClient } from '@tanstack/react-query';
import { CAPABILITY_RETRY_GUARDS } from '../composition/capability-query-retry';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          if (CAPABILITY_RETRY_GUARDS.some((stops) => stops(error))) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/** Default app-wide query client. */
export const queryClient = createQueryClient();
