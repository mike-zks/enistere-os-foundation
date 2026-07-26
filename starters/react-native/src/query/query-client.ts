/**
 * TanStack Query client factory + default singleton du runtime neutre.
 *
 * Defaults are conservative and mobile-friendly. No business queries or query
 * keys live here. The baseline has no authenticated transport, so retry is a
 * simple bounded policy; the capability Auth composée remplace ce fichier via
 * son overlay pour ne jamais réessayer un 401 (pont 401 possédé par l'AuthEngine).
 */
import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount) => failureCount < 2,
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
