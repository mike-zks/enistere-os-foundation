import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/app.dart';
import 'package:mobile_flutter/src/core/auth/auth_controller.dart';
import 'package:mobile_flutter/src/features/auth/sign_in_screen.dart';
import 'package:mobile_flutter/src/features/home/home_screen.dart';
import 'package:mobile_flutter/src/theme/enistere_tokens.dart';

Widget _app() => const ProviderScope(child: EnistereApp());

Future<void> _fillAndSubmit(
  WidgetTester tester, {
  String email = 'user@example.com',
  String password = 'password',
}) async {
  await tester.enterText(find.byKey(const Key('emailField')), email);
  await tester.enterText(find.byKey(const Key('passwordField')), password);
  await tester.tap(find.text('Se connecter'));
  await tester.pumpAndSettle();
}

void main() {
  group('SignInScreen', () {
    testWidgets('shows Enistere brand heading', (tester) async {
      await tester.pumpWidget(_app());
      await tester.pumpAndSettle();
      expect(find.byType(SignInScreen), findsOneWidget);
      expect(find.text('Enistere'), findsOneWidget);
    });

    testWidgets("shows email and password fields and 'Se connecter' button", (
      tester,
    ) async {
      await tester.pumpWidget(_app());
      await tester.pumpAndSettle();
      expect(find.byKey(const Key('emailField')), findsOneWidget);
      expect(find.byKey(const Key('passwordField')), findsOneWidget);
      expect(find.text('Se connecter'), findsOneWidget);
    });

    testWidgets('submit button height meets minTouchTarget', (tester) async {
      await tester.pumpWidget(_app());
      await tester.pumpAndSettle();
      final sizedBoxes = tester.widgetList<SizedBox>(find.byType(SizedBox));
      final buttonBox = sizedBoxes.firstWhere(
        (b) => b.height == EnistereTokens.minTouchTarget,
        orElse: () => throw TestFailure(
          'No SizedBox with height ${EnistereTokens.minTouchTarget} found',
        ),
      );
      expect(buttonBox.height, EnistereTokens.minTouchTarget);
    });

    testWidgets('email field is required — shows error when empty', (
      tester,
    ) async {
      await tester.pumpWidget(_app());
      await tester.pumpAndSettle();
      await tester.tap(find.text('Se connecter'));
      await tester.pumpAndSettle();
      expect(find.text('Email requis'), findsOneWidget);
    });

    testWidgets('email field shows format error for missing @', (tester) async {
      await tester.pumpWidget(_app());
      await tester.pumpAndSettle();
      await tester.enterText(find.byKey(const Key('emailField')), 'notanemail');
      await tester.tap(find.text('Se connecter'));
      await tester.pumpAndSettle();
      expect(find.text('Format invalide'), findsOneWidget);
    });

    testWidgets('password field is required — shows error when empty', (
      tester,
    ) async {
      await tester.pumpWidget(_app());
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byKey(const Key('emailField')),
        'user@example.com',
      );
      await tester.tap(find.text('Se connecter'));
      await tester.pumpAndSettle();
      expect(find.text('Mot de passe requis'), findsOneWidget);
    });

    testWidgets('valid submit navigates to HomeScreen', (tester) async {
      await tester.pumpWidget(_app());
      await tester.pumpAndSettle();
      await _fillAndSubmit(tester);
      expect(find.byType(HomeScreen), findsOneWidget);
      expect(find.byType(SignInScreen), findsNothing);
    });

    testWidgets('signIn failure shows generic error message', (tester) async {
      // Override authController to throw on signIn
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authControllerProvider.overrideWith(ThrowingAuthController.new),
          ],
          child: const EnistereApp(),
        ),
      );
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byKey(const Key('emailField')),
        'user@example.com',
      );
      await tester.enterText(
        find.byKey(const Key('passwordField')),
        'wrongpass',
      );
      await tester.tap(find.text('Se connecter'));
      await tester.pumpAndSettle();
      expect(
        find.text('Une erreur est survenue. Veuillez réessayer.'),
        findsOneWidget,
      );
      expect(find.byType(SignInScreen), findsOneWidget);
    });

    testWidgets('password field uses obscureText', (tester) async {
      await tester.pumpWidget(_app());
      await tester.pumpAndSettle();
      final field = tester.widget<EditableText>(
        find.descendant(
          of: find.byKey(const Key('passwordField')),
          matching: find.byType(EditableText),
        ),
      );
      expect(field.obscureText, isTrue);
    });

    testWidgets('Enistere theme primary color applied to screen', (
      tester,
    ) async {
      await tester.pumpWidget(_app());
      await tester.pumpAndSettle();
      final context = tester.element(find.byType(SignInScreen));
      expect(
        Theme.of(context).colorScheme.primary,
        equals(EnistereTokens.lightPrimary),
      );
    });
  });
}

/// Stub AuthController that throws on signIn so we can test error handling.
class ThrowingAuthController extends AuthController {
  @override
  Future<void> signIn(String email, String password) async {
    throw Exception('auth error');
  }
}
