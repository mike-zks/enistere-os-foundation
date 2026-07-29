import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/auth/auth_api.dart';
import 'package:mobile_flutter/src/auth/auth_controller.dart';
import 'package:mobile_flutter/src/auth/auth_errors.dart';
import 'package:mobile_flutter/src/auth/auth_session.dart';
import 'package:mobile_flutter/src/auth/credential_store.dart';
import 'package:mobile_flutter/src/core/storage/secure_storage.dart';
import 'package:mobile_flutter/src/core/storage/secure_storage_provider.dart';

AuthSession _session(String access, String refresh) => AuthSession(
  user: const AuthUser(id: 'u-1', email: 'ada@example.test', status: 'active'),
  accessToken: access,
  refreshToken: refresh,
  tokenType: 'Bearer',
  accessTokenExpiresIn: 900,
  refreshTokenExpiresIn: 2592000,
);

/// Everything a widget can reach through the exposed state. If a token ever
/// appears here, it appears in this string too.
String _observable(AuthSnapshot snapshot) =>
    '${snapshot.status}|${snapshot.user?.id}'
    '|${snapshot.user?.email}|${snapshot.user?.status}';

final class _FakeAuthApi implements AuthApi {
  int refreshCalls = 0;
  int logoutCalls = 0;
  bool refreshFails = false;
  bool logoutThrows = false;

  @override
  Future<AuthSession> login(String email, String password) async =>
      _session('access-1', 'refresh-1');

  @override
  Future<AuthSession> refresh(String refreshToken) async {
    refreshCalls += 1;
    // Yields so concurrent callers genuinely overlap.
    await Future<void>.delayed(Duration.zero);
    if (refreshFails) throw const AuthError(genericUnavailableMessage);
    return _session('access-2', 'refresh-2');
  }

  @override
  Future<void> logout(String refreshToken) async {
    logoutCalls += 1;
    if (logoutThrows) throw StateError('transport down');
  }
}

final class _RecordingAdapter implements SecureStorageAdapter {
  final values = <String, String>{};

  @override
  String get contractVersion => secureStorageContractVersion;

  @override
  Future<String?> get(String key) async => values[key];

  @override
  Future<void> set(String key, String value) async => values[key] = value;

  @override
  Future<void> remove(String key) async => values.remove(key);
}

void main() {
  late _FakeAuthApi api;
  late InMemoryCredentialStore store;
  late ProviderContainer container;
  late AuthController controller;

  setUp(() {
    api = _FakeAuthApi();
    store = InMemoryCredentialStore();
    container = ProviderContainer(
      overrides: [
        authApiProvider.overrideWithValue(api),
        credentialStoreProvider.overrideWithValue(store),
      ],
    );
    addTearDown(container.dispose);
    controller = container.read(authControllerProvider.notifier);
  });

  test(
    'signIn établit la session sans exposer de jeton dans l’état observable',
    () async {
      await controller.signIn('ada@example.test', 'correct horse');

      final snapshot = container.read(authControllerProvider);
      expect(snapshot.isAuthenticated, isTrue);
      expect(snapshot.user?.email, 'ada@example.test');
      expect(_observable(snapshot), isNot(contains('access-1')));
      expect(_observable(snapshot), isNot(contains('refresh-1')));
    },
  );

  test(
    'garde le jeton d’accès hors du stockage et le refresh derrière la couture',
    () async {
      await controller.signIn('ada@example.test', 'correct horse');

      expect(controller.accessToken, 'access-1');
      expect(await store.read(), 'refresh-1');
    },
  );

  test(
    'le refresh ne transite que par la couture de stockage sécurisé',
    () async {
      final adapter = _RecordingAdapter();
      final scoped = ProviderContainer(
        overrides: [
          authApiProvider.overrideWithValue(api),
          secureStorageProvider.overrideWith((ref) => SecureStorage(adapter)),
        ],
      );
      addTearDown(scoped.dispose);

      await scoped
          .read(authControllerProvider.notifier)
          .signIn('a@b.test', 'x');

      // The keystore holds the refresh credential, under a scoped key, and holds
      // nothing else: the access token never reaches durable storage.
      expect(adapter.values.keys.toList(), ['auth.refresh_token']);
      expect(adapter.values['auth.refresh_token'], 'refresh-1');
      expect(adapter.values.values, isNot(contains('access-1')));
    },
  );

  test('coalesce plusieurs refresh concurrents en un seul appel', () async {
    await controller.signIn('ada@example.test', 'correct horse');

    final first = controller.refresh();
    final second = controller.refresh();
    final restored = controller.restore();
    await Future.wait<void>([first, second, restored]);

    // The authority rotates on every use and treats a replay as reuse: a second
    // call here would revoke the family and sign the user out.
    expect(api.refreshCalls, 1);
    expect(await first, 'access-2');
    expect(await store.read(), 'refresh-2');
  });

  test('purge la session locale quand le refresh échoue', () async {
    await controller.signIn('ada@example.test', 'correct horse');
    api.refreshFails = true;

    expect(await controller.refresh(), isNull);
    expect(container.read(authControllerProvider).isAuthenticated, isFalse);
    expect(controller.accessToken, isNull);
    expect(await store.read(), isNull);
  });

  test(
    'un refresh sans créance stockée purge sans appeler l’autorité',
    () async {
      expect(await controller.refresh(), isNull);

      expect(api.refreshCalls, 0);
      expect(container.read(authControllerProvider).isAuthenticated, isFalse);
    },
  );

  test('signOut demande la révocation distante puis purge', () async {
    await controller.signIn('ada@example.test', 'correct horse');

    await controller.signOut();

    expect(api.logoutCalls, 1);
    expect(container.read(authControllerProvider).isAuthenticated, isFalse);
    expect(controller.accessToken, isNull);
    expect(await store.read(), isNull);
  });

  test('purge même si la révocation distante échoue', () async {
    await controller.signIn('ada@example.test', 'correct horse');
    api.logoutThrows = true;

    await controller.signOut();

    // The guarantee lives in the controller, not in the transport: a sign-out
    // must end signed out locally whatever the authority answered.
    expect(api.logoutCalls, 1);
    expect(container.read(authControllerProvider).isAuthenticated, isFalse);
    expect(await store.read(), isNull);
  });
}
