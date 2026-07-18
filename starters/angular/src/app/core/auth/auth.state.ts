export type AuthState =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'refreshing'
  | 'expired';
