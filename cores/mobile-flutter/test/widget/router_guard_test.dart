import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_flutter/app.dart';
import 'package:mobile_flutter/src/core/auth/auth_controller.dart';
import 'package:mobile_flutter/src/core/auth/session_envelope.dart';
import 'package:mobile_flutter/src/core/auth/session_store.dart';
import 'package:mobile_flutter/src/features/auth/sign_in_screen.dart';
import 'package:mobile_flutter/src/features/home/home_screen.dart';

Widget buildApp({SessionStore? store}) {
  return ProviderScope(
    overrides: [
      if (store != null) sessionStoreProvider.overrideWithValue(store),
    ],
    child: const EnistereApp(),
  );
}

void main() {
  group('Router guards', () {
    testWidgets('shows SignInScreen after init with no session', (
      tester,
    ) async {
      await tester.pumpWidget(buildApp());
      await tester.pumpAndSettle();
      expect(find.byType(SignInScreen), findsOneWidget);
    });

    testWidgets('shows HomeScreen after init with existing session', (
      tester,
    ) async {
      final store = InMemorySessionStore();
      await store.write(const SessionEnvelope(userId: 'user-1'));
      await tester.pumpWidget(buildApp(store: store));
      await tester.pumpAndSettle();
      expect(find.byType(HomeScreen), findsOneWidget);
    });

    testWidgets('signing in navigates from SignInScreen to HomeScreen', (
      tester,
    ) async {
      await tester.pumpWidget(buildApp());
      await tester.pumpAndSettle();
      expect(find.byType(SignInScreen), findsOneWidget);
      await tester.enterText(
        find.byKey(const Key('emailField')),
        'user@example.com',
      );
      await tester.enterText(
        find.byKey(const Key('passwordField')),
        'password',
      );
      await tester.tap(find.text('Se connecter'));
      await tester.pumpAndSettle();
      expect(find.byType(HomeScreen), findsOneWidget);
    });

    testWidgets('signing out navigates from HomeScreen to SignInScreen', (
      tester,
    ) async {
      final store = InMemorySessionStore();
      await store.write(const SessionEnvelope(userId: 'user-1'));
      await tester.pumpWidget(buildApp(store: store));
      await tester.pumpAndSettle();
      expect(find.byType(HomeScreen), findsOneWidget);
      await tester.tap(find.byIcon(Icons.logout));
      await tester.pumpAndSettle();
      expect(find.byType(SignInScreen), findsOneWidget);
    });

    testWidgets(
      'authenticated user navigating to /sign-in is redirected to /home',
      (tester) async {
        final store = InMemorySessionStore();
        await store.write(const SessionEnvelope(userId: 'user-1'));
        await tester.pumpWidget(buildApp(store: store));
        await tester.pumpAndSettle();
        final context = tester.element(find.byType(HomeScreen));
        GoRouter.of(context).go('/sign-in');
        await tester.pumpAndSettle();
        expect(find.byType(HomeScreen), findsOneWidget);
        expect(find.byType(SignInScreen), findsNothing);
      },
    );
  });
}
