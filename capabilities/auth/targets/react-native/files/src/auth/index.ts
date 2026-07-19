/**
 * Auth module public surface (generic shell — ADR-004 / ADR-011 / ADR-015).
 */
export { AuthProvider } from './AuthProvider';
export type { AuthProviderProps } from './AuthProvider';
export { useAuth } from './useAuth';
export { AuthContext } from './auth-context';
export type { AuthContextValue } from './auth-context';
export { AuthEngine } from './auth-engine';
export type { AuthEngineDeps } from './auth-engine';
export { PlaceholderAuthApi, AuthApiError } from './auth-api';
export type { AuthApi, AuthSessionData } from './auth-api';
export { EnistereAuthApi } from './enistere-auth-api';
export { MobileAuthSessionAdapter, mobileAuthSession } from './session-adapter';
export type { AuthEngineBinding } from './session-adapter';
export { toAuthSessionData } from './token-mapping';
export type { ApiTokenPayload } from './token-mapping';
export { initialAuthState } from './session';
export type {
  AuthStatus,
  AuthUser,
  AuthSession,
  SessionSnapshot,
  AuthState,
  SignInInput,
} from './session';
