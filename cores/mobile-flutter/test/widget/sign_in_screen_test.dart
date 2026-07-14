import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/app.dart';
import 'package:mobile_flutter/src/features/auth/sign_in_screen.dart';
import 'package:mobile_flutter/src/theme/enistere_tokens.dart';

Widget _app() => const ProviderScope(child: EnistereApp());

void main() {
  group('SignInScreen', () {
    testWidgets('shows Enistere brand heading', (tester) async {
      await tester.pumpWidget(_app());
      await tester.pumpAndSettle();
      expect(find.byType(SignInScreen), findsOneWidget);
      expect(find.text('Enistere'), findsOneWidget);
    });

    testWidgets("shows 'Se connecter' button", (tester) async {
      await tester.pumpWidget(_app());
      await tester.pumpAndSettle();
      expect(find.text('Se connecter'), findsOneWidget);
    });

    testWidgets('sign-in button height meets minTouchTarget', (tester) async {
      await tester.pumpWidget(_app());
      await tester.pumpAndSettle();
      // The FilledButton is wrapped in a SizedBox with height = minTouchTarget.
      final sizedBoxes = tester.widgetList<SizedBox>(find.byType(SizedBox));
      final buttonBox = sizedBoxes.firstWhere(
        (b) => b.height == EnistereTokens.minTouchTarget,
        orElse: () => throw TestFailure(
          'No SizedBox with height ${EnistereTokens.minTouchTarget} found',
        ),
      );
      expect(buttonBox.height, EnistereTokens.minTouchTarget);
    });

    testWidgets('sign-in button triggers navigation to HomeScreen', (
      tester,
    ) async {
      await tester.pumpWidget(_app());
      await tester.pumpAndSettle();
      await tester.tap(find.text('Se connecter'));
      await tester.pumpAndSettle();
      // After sign-in the router redirects to /home.
      expect(find.byType(SignInScreen), findsNothing);
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
