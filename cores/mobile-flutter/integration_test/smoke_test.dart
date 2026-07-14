// Flutter 6 — Smoke test suite
//
// Run on Android emulator:   flutter test integration_test/ -d emulator-5554
// Run on iOS device/sim:     flutter test integration_test/ -d <ios-device-id>
//
// Not executed by `flutter test` alone (requires a real device / emulator).
// Results are recorded in docs/project-status/MOBILE_FLUTTER6_SMOKE_REPORT.md.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mobile_flutter/app.dart';
import 'package:mobile_flutter/src/core/auth/auth_controller.dart';
import 'package:mobile_flutter/src/core/auth/session_envelope.dart';
import 'package:mobile_flutter/src/core/auth/session_store.dart';
import 'package:mobile_flutter/src/features/auth/sign_in_screen.dart';
import 'package:mobile_flutter/src/features/home/home_screen.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Smoke — app startup', () {
    testWidgets('app starts and renders without crash', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: EnistereApp()));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });

    testWidgets('unauthenticated user sees SignInScreen', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: EnistereApp()));
      await tester.pumpAndSettle();
      expect(find.byType(SignInScreen), findsOneWidget);
    });
  });

  group('Smoke — auth flow', () {
    testWidgets('sign-in tap navigates to HomeScreen', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: EnistereApp()));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Se connecter'));
      await tester.pumpAndSettle();
      expect(find.byType(HomeScreen), findsOneWidget);
    });

    testWidgets('logout tap returns to SignInScreen', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: EnistereApp()));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Se connecter'));
      await tester.pumpAndSettle();
      await tester.tap(find.byIcon(Icons.logout));
      await tester.pumpAndSettle();
      expect(find.byType(SignInScreen), findsOneWidget);
    });

    testWidgets('authenticated start shows HomeScreen directly', (
      tester,
    ) async {
      final store = InMemorySessionStore();
      await store.write(const SessionEnvelope(userId: 'smoke-user'));
      await tester.pumpWidget(
        ProviderScope(
          overrides: [sessionStoreProvider.overrideWithValue(store)],
          child: const EnistereApp(),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.byType(HomeScreen), findsOneWidget);
      expect(find.textContaining('smoke-user'), findsOneWidget);
    });
  });
}
