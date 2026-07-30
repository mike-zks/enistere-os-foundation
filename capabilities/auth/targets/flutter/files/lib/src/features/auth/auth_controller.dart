import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'auth_api.dart';
import 'auth_session.dart';
import 'credential_store.dart';

/// Owns the session. The only place that holds tokens.
///
/// The access token lives in a private field, never in the exposed state: the
/// state is what every widget may watch, so putting a token there would turn
/// "the UI can render the session" into "the UI can read the credential". What
/// widgets observe is an [AuthSnapshot], and it carries no token.
final class AuthController extends Notifier<AuthSnapshot> {
  String? _accessToken;
  Future<String?>? _inFlightRefresh;

  @override
  AuthSnapshot build() => AuthSnapshot.anonymous;

  /// The access token, for the interceptor only. Never exposed to widgets.
  String? get accessToken => _accessToken;

  Future<void> signIn(String email, String password) async {
    final session = await ref.read(authApiProvider).login(email, password);
    await _adopt(session);
  }

  /// Restores a session from the persisted credential. Shares the coalescing of
  /// [refresh]: a launch that restores while a first request already got a 401
  /// must still spend the refresh token exactly once.
  Future<void> restore() async {
    await refresh();
  }

  /// Refreshes at most once for any number of concurrent callers.
  ///
  /// Two requests failing with 401 at the same instant would otherwise each
  /// spend the refresh token; since the authority rotates on every use and
  /// treats a replay as reuse, the second call would revoke the whole family and
  /// sign the user out. Coalescing is a correctness requirement here, not an
  /// optimisation.
  Future<String?> refresh() {
    return _inFlightRefresh ??= _refreshOnce().whenComplete(() {
      _inFlightRefresh = null;
    });
  }

  /// Signs out: asks the authority to revoke, then purges locally whatever the
  /// answer. A failed revocation must not leave a local session behind.
  Future<void> signOut() async {
    final store = ref.read(credentialStoreProvider);
    final refreshToken = await store.read();
    try {
      if (refreshToken != null) {
        await ref.read(authApiProvider).logout(refreshToken);
      }
    } catch (_) {
      // The guarantee lives here, not in the API layer: whatever the transport
      // does, a sign-out must end signed out locally. Relying on the client to
      // swallow failures would break the moment it is swapped.
    } finally {
      await _purge();
    }
  }

  Future<String?> _refreshOnce() async {
    final refreshToken = await ref.read(credentialStoreProvider).read();
    if (refreshToken == null) {
      await _purge();
      return null;
    }
    try {
      final session = await ref.read(authApiProvider).refresh(refreshToken);
      await _adopt(session);
      return session.accessToken;
    } catch (_) {
      // A refresh that fails is a session that no longer exists. Keeping the
      // local state would show a signed-in shell over an expired session.
      await _purge();
      return null;
    }
  }

  Future<void> _adopt(AuthSession session) async {
    _accessToken = session.accessToken;
    await ref.read(credentialStoreProvider).write(session.refreshToken);
    state = AuthSnapshot(status: AuthStatus.authenticated, user: session.user);
  }

  Future<void> _purge() async {
    _accessToken = null;
    await ref.read(credentialStoreProvider).clear();
    state = AuthSnapshot.anonymous;
  }
}

final authControllerProvider = NotifierProvider<AuthController, AuthSnapshot>(
  AuthController.new,
);
