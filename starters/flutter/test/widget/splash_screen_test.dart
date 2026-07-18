import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/app.dart';
import 'package:mobile_flutter/src/core/auth/auth_controller.dart';
import 'package:mobile_flutter/src/core/auth/session_envelope.dart';
import 'package:mobile_flutter/src/core/auth/session_store.dart';
import 'package:mobile_flutter/src/features/splash/splash_screen.dart';

/// Session store that blocks until explicitly completed — used to hold the app
/// in the auth-loading state for the duration of the test.
class _BlockingSessionStore implements SessionStore {
  final _completer = Completer<SessionEnvelope?>();

  @override
  Future<SessionEnvelope?> read() => _completer.future;

  @override
  Future<void> write(SessionEnvelope envelope) async {}

  @override
  Future<void> clear() async {}
}

void main() {
  group('SplashScreen', () {
    testWidgets('renders without error', (tester) async {
      await tester.pumpWidget(const MaterialApp(home: SplashScreen()));
      expect(tester.takeException(), isNull);
    });

    testWidgets('shows CircularProgressIndicator', (tester) async {
      await tester.pumpWidget(const MaterialApp(home: SplashScreen()));
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('indicator is centred within the Scaffold', (tester) async {
      await tester.pumpWidget(const MaterialApp(home: SplashScreen()));
      final center = find.byType(Center);
      expect(center, findsWidgets);
      expect(
        find.descendant(
          of: find.byType(Scaffold),
          matching: find.byType(CircularProgressIndicator),
        ),
        findsOneWidget,
      );
    });

    testWidgets(
      'app shows SplashScreen while auth is loading (blocking store)',
      (tester) async {
        final store = _BlockingSessionStore();
        await tester.pumpWidget(
          ProviderScope(
            overrides: [sessionStoreProvider.overrideWithValue(store)],
            child: const EnistereApp(),
          ),
        );
        // Single pump — async _initialize() is pending, auth state is loading.
        await tester.pump();
        expect(find.byType(SplashScreen), findsOneWidget);
      },
    );
  });
}
