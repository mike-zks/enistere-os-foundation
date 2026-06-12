/**
 * TanStack Query client factory + default singleton.
 *
 * Defaults are conservative and mobile-friendly. No business queries or query
 * keys live here — those belong to feature modules in consuming apps.
 */
import { QueryClient } from '@tanstack/react-query';

import { ApiClientError } from '../api';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          // Never retry auth failures; they need a re-auth, not another attempt.
          if (error instanceof ApiClientError && error.isUnauthorized) {
            return false;
          }
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
