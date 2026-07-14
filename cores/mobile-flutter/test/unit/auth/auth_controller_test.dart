import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/core/auth/auth_controller.dart';
import 'package:mobile_flutter/src/core/auth/auth_state.dart';
import 'package:mobile_flutter/src/core/auth/auth_status.dart';
import 'package:mobile_flutter/src/core/auth/session_envelope.dart';
import 'package:mobile_flutter/src/core/auth/session_store.dart';

ProviderContainer makeContainer({SessionStore? store}) {
  final container = ProviderContainer(
    overrides: [
      if (store != null) sessionStoreProvider.overrideWithValue(store),
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
