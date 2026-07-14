import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'auth_state.dart';
import 'auth_status.dart';
import 'session_envelope.dart';
import 'session_store.dart';

// Override in tests or derived projects to inject a real SessionStore adapter.
final sessionStoreProvider = Provider<SessionStore>(
  (ref) => InMemorySessionStore(),
);

class AuthController extends Notifier<AuthState> {
  // Access token is held in memory only — it MUST NOT appear in state, logs,
  // or any persistent store (ADR-015).
  String? _accessToken;
  late SessionStore _store;

  @override
  AuthState build() {
    _store = ref.read(sessionStoreProvider);
    _initialize();
    return const AuthState(status: AuthStatus.loading);
  }

  Future<void> _initialize() async {
    try {
      final envelope = await _store.read();
      if (envelope != null) {
        // Future: exchange refresh token for access token via POST /auth/refresh.
        _accessToken = 'placeholder-access-token';
        state = AuthState(
          status: AuthStatus.authenticated,
          userId: envelope.userId,
        );
      } else {
        state = const AuthState(status: AuthStatus.unauthenticated);
      }
    } catch (_) {
      // Fail-soft: treat any store read error as unauthenticated.
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  // Placeholder: no network call — future: POST /auth/login.
  Future<void> signIn(String email, String password) async {
    _accessToken = 'placeholder-access-token';
    const envelope = SessionEnvelope(userId: 'placeholder-user');
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
