/**
 * Auth module public surface (generic shell — ADR-004 / ADR-015).
 */
export { AuthProvider } from './AuthProvider';
export { useAuth } from './useAuth';
export { AuthContext } from './auth-context';
export type { AuthContextValue } from './auth-context';
export { initialAuthState } from './session';
export type {
  AuthStatus,
  AuthUser,
  AuthSession,
  AuthState,
  SignInInput,
} from './session';
