import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/app.dart';
import 'package:mobile_flutter/src/core/auth/auth_controller.dart';
import 'package:mobile_flutter/src/core/auth/session_envelope.dart';
import 'package:mobile_flutter/src/core/auth/session_store.dart';
import 'package:mobile_flutter/src/features/auth/sign_in_screen.dart';
import 'package:mobile_flutter/src/features/home/home_screen.dart';

void main() {
  group('EnistereApp', () {
    testWidgets('builds without error', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: EnistereApp()));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });

    testWidgets('shows SignInScreen by default (no session)', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: EnistereApp()));
      await tester.pumpAndSettle();
      expect(find.byType(SignInScreen), findsOneWidget);
    });

    testWidgets('shows HomeScreen when session exists', (tester) async {
      final store = InMemorySessionStore();
      await store.write(const SessionEnvelope(userId: 'user-1'));
      await tester.pumpWidget(
        ProviderScope(
          overrides: [sessionStoreProvider.overrideWithValue(store)],
          child: const EnistereApp(),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.byType(HomeScreen), findsOneWidget);
    });

    testWidgets('theme is applied — primary color from tokens', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: EnistereApp()));
      await tester.pumpAndSettle();
      final context = tester.element(find.byType(SignInScreen));
      expect(
        Theme.of(context).colorScheme.primary,
        equals(const Color(0xFF2563EB)),
      );
    });
  });
}
