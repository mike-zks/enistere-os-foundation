import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/core/auth/auth_api.dart';
import 'package:mobile_flutter/src/core/auth/auth_controller.dart';
import 'package:mobile_flutter/src/core/auth/auth_state.dart';
import 'package:mobile_flutter/src/core/auth/auth_status.dart';
import 'package:mobile_flutter/src/core/auth/session_envelope.dart';
import 'package:mobile_flutter/src/core/auth/session_store.dart';

class FakeAuthApi implements AuthApi {
  FakeAuthApi({this.result, this.error});

  final String? result;
  final Object? error;
  int callCount = 0;

  @override
  Future<String> refresh(String refreshToken) async {
    callCount++;
    if (error != null) throw error!;
    return result!;
  }
}

ProviderContainer makeContainer({SessionStore? store, AuthApi? authApi}) {
  final container = ProviderContainer(
    overrides: [
      if (store != null) sessionStoreProvider.overrideWithValue(store),
      if (authApi != null) authApiProvider.overrideWithValue(authApi),
    ],
  );
  addTearDown(container.dispose);
  return container;
}

void main() {
  group('AuthController', () {
    test('initial state is loading', () {
      final container = makeContainer();
      expect(container.read(authControllerProvider).status, AuthStatus.loading);
    });

    test('initializes to unauthenticated when no session', () async {
      final container = makeContainer();
      container.read(authControllerProvider); // trigger build
      await Future<void>.delayed(Duration.zero);
      expect(
        container.read(authControllerProvider).status,
        AuthStatus.unauthenticated,
      );
    });

    test('initializes to authenticated when session exists', () async {
      final store = InMemorySessionStore();
      await store.write(const SessionEnvelope(userId: 'user-1'));
      final container = makeContainer(store: store);
      container.read(authControllerProvider);
      await Future<void>.delayed(Duration.zero);
      final state = container.read(authControllerProvider);
      expect(state.status, AuthStatus.authenticated);
      expect(state.userId, 'user-1');
    });

    test('signIn transitions to authenticated', () async {
      final container = makeContainer();
      await Future<void>.delayed(Duration.zero);
      await container
          .read(authControllerProvider.notifier)
          .signIn('u@example.com', 'password');
      final state = container.read(authControllerProvider);
      expect(state.status, AuthStatus.authenticated);
      expect(state.userId, isNotNull);
    });

    test('signOut transitions to unauthenticated and clears session', () async {
      final store = InMemorySessionStore();
      await store.write(const SessionEnvelope(userId: 'user-1'));
      final container = makeContainer(store: store);
      container.read(authControllerProvider);
      await Future<void>.delayed(Duration.zero);
      await container.read(authControllerProvider.notifier).signOut();
      expect(
        container.read(authControllerProvider).status,
        AuthStatus.unauthenticated,
      );
      expect(await store.read(), isNull);
    });

    test('access token is never exposed in state toString', () async {
      final container = makeContainer();
      await Future<void>.delayed(Duration.zero);
      await container
          .read(authControllerProvider.notifier)
          .signIn('u@example.com', 'password');
      final state = container.read(authControllerProvider);
      expect(state.toString(), isNot(contains('token')));
    });
  });

  group('AuthController.refreshSession()', () {
    test(
      'returns new access token and updates _accessToken on success',
      () async {
        final store = InMemorySessionStore();
        await store.write(
          const SessionEnvelope(userId: 'user-1', refreshToken: 'ref-tok'),
        );
        final fakeApi = FakeAuthApi(result: 'new-access');
        final container = makeContainer(store: store, authApi: fakeApi);
        container.read(authControllerProvider);
        await Future<void>.delayed(Duration.zero);

        final controller = container.read(authControllerProvider.notifier);
        final result = await controller.refreshSession();

        expect(result, 'new-access');
        expect(controller.accessToken, 'new-access');
        expect(fakeApi.callCount, 1);
      },
    );

    test(
      'coalesces concurrent calls — AuthApi.refresh() called once',
      () async {
        final store = InMemorySessionStore();
        await store.write(
          const SessionEnvelope(userId: 'user-1', refreshToken: 'ref-tok'),
        );
        final fakeApi = FakeAuthApi(result: 'new-access');
        final container = makeContainer(store: store, authApi: fakeApi);
        container.read(authControllerProvider);
        await Future<void>.delayed(Duration.zero);

        final controller = container.read(authControllerProvider.notifier);
        // All three calls start synchronously before any await resolves.
        final results = await Future.wait([
          controller.refreshSession(),
          controller.refreshSession(),
          controller.refreshSession(),
        ]);

        expect(
          fakeApi.callCount,
          1,
          reason: 'only one refresh despite 3 callers',
        );
        expect(results, everyElement('new-access'));
      },
    );

    test(
      'purges session and returns null when refreshToken is absent',
      () async {
        final store = InMemorySessionStore();
        await store.write(
          const SessionEnvelope(userId: 'user-1'), // no refreshToken
        );
        final fakeApi = FakeAuthApi(result: 'irrelevant');
        final container = makeContainer(store: store, authApi: fakeApi);
        container.read(authControllerProvider);
        await Future<void>.delayed(Duration.zero);

        final controller = container.read(authControllerProvider.notifier);
        final result = await controller.refreshSession();

        expect(result, isNull);
        expect(controller.accessToken, isNull);
        expect(
          container.read(authControllerProvider).status,
          AuthStatus.unauthenticated,
        );
        expect(await store.read(), isNull, reason: 'session purged from store');
        expect(
          fakeApi.callCount,
          0,
          reason: 'AuthApi not called when no refreshToken',
        );
      },
    );

    test('purges session and returns null when AuthApi throws', () async {
      final store = InMemorySessionStore();
      await store.write(
        const SessionEnvelope(userId: 'user-1', refreshToken: 'ref-tok'),
      );
      final fakeApi = FakeAuthApi(error: Exception('server rejected refresh'));
      final container = makeContainer(store: store, authApi: fakeApi);
      container.read(authControllerProvider);
      await Future<void>.delayed(Duration.zero);

      final controller = container.read(authControllerProvider.notifier);
      final result = await controller.refreshSession();

      expect(result, isNull);
      expect(controller.accessToken, isNull);
      expect(
        container.read(authControllerProvider).status,
        AuthStatus.unauthenticated,
      );
      expect(
        await store.read(),
        isNull,
        reason: 'session purged on auth failure',
      );
    });

    test('refreshed access token is never exposed in state', () async {
      final store = InMemorySessionStore();
      await store.write(
        const SessionEnvelope(userId: 'user-1', refreshToken: 'ref-tok'),
      );
      final fakeApi = FakeAuthApi(result: 'super-secret-new-token');
      final container = makeContainer(store: store, authApi: fakeApi);
      container.read(authControllerProvider);
      await Future<void>.delayed(Duration.zero);

      await container.read(authControllerProvider.notifier).refreshSession();
      final state = container.read(authControllerProvider);

      expect(state.toString(), isNot(contains('super-secret-new-token')));
    });
  });

  group('AuthState', () {
    test('isLoading is true only for loading status', () {
      expect(const AuthState(status: AuthStatus.loading).isLoading, isTrue);
      expect(
        const AuthState(status: AuthStatus.unauthenticated).isLoading,
        isFalse,
      );
    });

    test('isAuthenticated is true only for authenticated status', () {
      expect(
        const AuthState(
          status: AuthStatus.authenticated,
          userId: 'u',
        ).isAuthenticated,
        isTrue,
      );
      expect(
        const AuthState(status: AuthStatus.expired).isAuthenticated,
        isFalse,
      );
    });

    test('equality compares status and userId', () {
      const a = AuthState(status: AuthStatus.authenticated, userId: 'u');
      const b = AuthState(status: AuthStatus.authenticated, userId: 'u');
      const c = AuthState(status: AuthStatus.authenticated, userId: 'x');
      expect(a, equals(b));
      expect(a, isNot(equals(c)));
    });
  });
}
