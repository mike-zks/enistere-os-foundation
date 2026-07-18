import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/app.dart';
import 'package:mobile_flutter/src/core/auth/auth_controller.dart';
import 'package:mobile_flutter/src/core/auth/session_envelope.dart';
import 'package:mobile_flutter/src/core/auth/session_store.dart';
import 'package:mobile_flutter/src/features/auth/sign_in_screen.dart';
import 'package:mobile_flutter/src/features/home/home_screen.dart';
import 'package:mobile_flutter/src/theme/enistere_theme_extension.dart';
import 'package:mobile_flutter/src/theme/enistere_tokens.dart';

Widget _appWithSession({String userId = 'test-user'}) {
  final store = InMemorySessionStore();
  store.write(SessionEnvelope(userId: userId));
  return ProviderScope(
    overrides: [sessionStoreProvider.overrideWithValue(store)],
    child: const EnistereApp(),
  );
}

void main() {
  group('HomeScreen', () {
    testWidgets('shows starter Flutter heading', (tester) async {
      await tester.pumpWidget(_appWithSession());
      await tester.pumpAndSettle();
      expect(find.byType(HomeScreen), findsOneWidget);
      expect(find.text('starter Flutter'), findsOneWidget);
    });

    testWidgets("shows 'Enistere' AppBar title", (tester) async {
      await tester.pumpWidget(_appWithSession());
      await tester.pumpAndSettle();
      // AppBar title inside the HomeScreen scaffold.
      expect(
        find.descendant(
          of: find.byType(AppBar),
          matching: find.text('Enistere'),
        ),
        findsOneWidget,
      );
    });

    testWidgets('shows logout icon in AppBar', (tester) async {
      await tester.pumpWidget(_appWithSession());
      await tester.pumpAndSettle();
      expect(find.byIcon(Icons.logout), findsOneWidget);
    });

    testWidgets('shows session userId', (tester) async {
      await tester.pumpWidget(_appWithSession(userId: 'user-42'));
      await tester.pumpAndSettle();
      expect(find.textContaining('user-42'), findsOneWidget);
    });

    testWidgets("shows ADR-034 subtitle text", (tester) async {
      await tester.pumpWidget(_appWithSession());
      await tester.pumpAndSettle();
      expect(find.textContaining('ADR-034'), findsOneWidget);
    });

    testWidgets('Enistere theme extension accessible from HomeScreen', (
      tester,
    ) async {
      await tester.pumpWidget(_appWithSession());
      await tester.pumpAndSettle();
      final context = tester.element(find.byType(HomeScreen));
      final ext = EnistereThemeExtension.of(context);
      expect(ext.spacingMd, EnistereTokens.spacingMd);
      expect(ext.minTouchTarget, EnistereTokens.minTouchTarget);
    });

    testWidgets('logout button navigates to SignInScreen', (tester) async {
      await tester.pumpWidget(_appWithSession());
      await tester.pumpAndSettle();
      expect(find.byType(HomeScreen), findsOneWidget);
      await tester.tap(find.byIcon(Icons.logout));
      await tester.pumpAndSettle();
      expect(find.byType(SignInScreen), findsOneWidget);
    });
  });
}
