import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'auth_api.dart';
import 'auth_state.dart';
import 'auth_status.dart';
import 'session_envelope.dart';
import 'session_store.dart';

// Override in tests or derived projects to inject a real SessionStore adapter.
// Production apps wire SecureSessionStore(FlutterSecureStorageAdapter()) here.
final sessionStoreProvider = Provider<SessionStore>(
  (ref) => InMemorySessionStore(),
);

// Override in tests or derived projects to inject a real token-refresh client.
// Production apps wire a real POST /auth/refresh implementation here.
final authApiProvider = Provider<AuthApi>((ref) => const PlaceholderAuthApi());

class AuthController extends Notifier<AuthState> {
  // Access token is held in memory only — it MUST NOT appear in state, logs,
  // or any persistent store (ADR-015).
  String? _accessToken;
  late SessionStore _store;
  late AuthApi _authApi;

  // Coalesces concurrent 401-triggered refresh calls. One POST /auth/refresh
  // in flight at a time; all waiting callers share the same Future result.
  Future<String?>? _refreshFuture;

  @override
  AuthState build() {
    _store = ref.read(sessionStoreProvider);
    _authApi = ref.read(authApiProvider);
    restoreSession();
    return const AuthState(status: AuthStatus.loading);
  }

  // Reads the persisted session envelope and restores auth state.
  // Defensive: corrupt / missing envelope → unauthenticated (SecureSessionStore purges).
  Future<void> restoreSession() async {
    try {
      final envelope = await _store.read();
      if (envelope != null) {
        _accessToken = 'placeholder-access-token';
        state = AuthState(
          status: AuthStatus.authenticated,
          userId: envelope.userId,
        );
      } else {
        state = const AuthState(status: AuthStatus.unauthenticated);
      }
    } catch (_) {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  // Exchanges the stored refresh token for a new access token (B3).
  // Concurrent calls coalesce — only one POST /auth/refresh in flight at a time.
  // Returns the new access token, or null if refresh failed (store already purged).
  Future<String?> refreshSession() async {
    _refreshFuture ??= _doRefresh().whenComplete(() => _refreshFuture = null);
    return _refreshFuture!;
  }

  Future<String?> _doRefresh() async {
    try {
      final envelope = await _store.read();
      final refreshToken = envelope?.refreshToken;
      if (refreshToken == null) {
        await _purgeSession();
        return null;
      }
      final newToken = await _authApi.refresh(refreshToken);
      _accessToken = newToken;
      return newToken;
    } catch (_) {
      await _purgeSession();
      return null;
    }
  }

  Future<void> _purgeSession() async {
    _accessToken = null;
    await _store.clear();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  // Placeholder: no network call — future: POST /auth/login.
  // Stores refreshToken in SessionEnvelope for persistence (B2).
  // Access token stays in _accessToken (memory-only, never persisted).
  Future<void> signIn(String email, String password) async {
    _accessToken = 'placeholder-access-token';
    const envelope = SessionEnvelope(
      userId: 'placeholder-user',
      refreshToken: 'placeholder-refresh-token',
    );
    await _store.write(envelope);
    state = const AuthState(
      status: AuthStatus.authenticated,
      userId: 'placeholder-user',
    );
  }

  Future<void> signOut() async {
    _accessToken = null;
    await _store.clear();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  // Exposed for the API client (Flutter 4) — access token never leaves this controller.
  String? get accessToken => _accessToken;
}

final authControllerProvider = NotifierProvider<AuthController, AuthState>(
  AuthController.new,
);
