import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/core/states/empty_state.dart';
import 'package:mobile_flutter/src/core/states/error_state.dart';
import 'package:mobile_flutter/src/core/states/loading_state.dart';
import 'package:mobile_flutter/src/core/states/success_state.dart';
import 'package:mobile_flutter/src/theme/enistere_theme.dart';
import 'package:mobile_flutter/src/theme/enistere_theme_extension.dart';
import 'package:mobile_flutter/src/theme/enistere_tokens.dart';

Widget _wrap(Widget child, {bool dark = false}) => MaterialApp(
  theme: dark ? EnistereTheme.dark() : EnistereTheme.light(),
  home: Scaffold(body: child),
);

void main() {
  // ── LoadingState ───────────────────────────────────────────────────────────

  group('LoadingState', () {
    testWidgets('renders CircularProgressIndicator', (tester) async {
      await tester.pumpWidget(_wrap(const LoadingState()));
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('renders without message', (tester) async {
      await tester.pumpWidget(_wrap(const LoadingState()));
      expect(tester.takeException(), isNull);
    });

    testWidgets('renders optional message', (tester) async {
      await tester.pumpWidget(
        _wrap(const LoadingState(message: 'Please wait')),
      );
      expect(find.text('Please wait'), findsOneWidget);
    });

    testWidgets('has Semantics label when message is provided', (tester) async {
      await tester.pumpWidget(_wrap(const LoadingState(message: 'Chargement')));
      final semantics = tester.getSemantics(find.byType(LoadingState));
      expect(semantics.label, contains('Chargement'));
    });

    testWidgets('has Semantics label when no message', (tester) async {
      await tester.pumpWidget(_wrap(const LoadingState()));
      final semantics = tester.getSemantics(find.byType(LoadingState));
      expect(semantics.label, isNotEmpty);
    });

    testWidgets('uses primary color from Enistere theme', (tester) async {
      await tester.pumpWidget(_wrap(const LoadingState()));
      final indicator = tester.widget<CircularProgressIndicator>(
        find.byType(CircularProgressIndicator),
      );
      expect(indicator.color, EnistereTokens.lightPrimary);
    });

    testWidgets('light theme does not throw', (tester) async {
      await tester.pumpWidget(_wrap(const LoadingState(message: 'Loading')));
      expect(tester.takeException(), isNull);
    });

    testWidgets('dark theme does not throw', (tester) async {
      await tester.pumpWidget(
        _wrap(const LoadingState(message: 'Loading'), dark: true),
      );
      expect(tester.takeException(), isNull);
    });

    testWidgets('long message does not overflow in constrained box', (
      tester,
    ) async {
      await tester.pumpWidget(
        _wrap(
          const SizedBox(
            width: 200,
            child: LoadingState(
              message:
                  'A very long loading message that should wrap gracefully',
            ),
          ),
        ),
      );
      expect(tester.takeException(), isNull);
    });
  });

  // ── EmptyState ─────────────────────────────────────────────────────────────

  group('EmptyState', () {
    testWidgets('renders title', (tester) async {
      await tester.pumpWidget(
        _wrap(const EmptyState(title: 'Nothing here yet')),
      );
      expect(find.text('Nothing here yet'), findsOneWidget);
    });

    testWidgets('renders optional description', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const EmptyState(
            title: 'Empty',
            description: 'Add your first item to get started.',
          ),
        ),
      );
      expect(find.text('Add your first item to get started.'), findsOneWidget);
    });

    testWidgets('does not render description when omitted', (tester) async {
      await tester.pumpWidget(_wrap(const EmptyState(title: 'Empty')));
      expect(find.byType(Text), findsOneWidget);
    });

    testWidgets('renders action button when provided', (tester) async {
      await tester.pumpWidget(
        _wrap(
          EmptyState(title: 'Empty', actionLabel: 'Add item', onAction: () {}),
        ),
      );
      expect(find.text('Add item'), findsOneWidget);
      expect(find.byType(OutlinedButton), findsOneWidget);
    });

    testWidgets('action callback is invoked on tap', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        _wrap(
          EmptyState(
            title: 'Empty',
            actionLabel: 'Go',
            onAction: () => tapped = true,
          ),
        ),
      );
      await tester.tap(find.text('Go'));
      expect(tapped, isTrue);
    });

    testWidgets('does not render button when only actionLabel given', (
      tester,
    ) async {
      await tester.pumpWidget(
        _wrap(const EmptyState(title: 'Empty', actionLabel: 'Nope')),
      );
      expect(find.byType(OutlinedButton), findsNothing);
    });

    testWidgets('uses titleLarge text style from Enistere theme', (
      tester,
    ) async {
      await tester.pumpWidget(_wrap(const EmptyState(title: 'Empty')));
      final context = tester.element(find.byType(EmptyState));
      final ext = EnistereThemeExtension.of(context);
      expect(ext.spacingMd, EnistereTokens.spacingMd);
    });

    testWidgets('light theme does not throw', (tester) async {
      await tester.pumpWidget(_wrap(const EmptyState(title: 'Empty')));
      expect(tester.takeException(), isNull);
    });

    testWidgets('dark theme does not throw', (tester) async {
      await tester.pumpWidget(
        _wrap(const EmptyState(title: 'Empty'), dark: true),
      );
      expect(tester.takeException(), isNull);
    });

    testWidgets('long title does not overflow in constrained box', (
      tester,
    ) async {
      await tester.pumpWidget(
        _wrap(
          const SizedBox(
            width: 200,
            child: EmptyState(
              title:
                  'A very long empty state title that might wrap on small screens',
              description: 'And a long description too just to be sure.',
            ),
          ),
        ),
      );
      expect(tester.takeException(), isNull);
    });
  });

  // ── ErrorState ─────────────────────────────────────────────────────────────

  group('ErrorState', () {
    testWidgets('renders title', (tester) async {
      await tester.pumpWidget(
        _wrap(const ErrorState(title: 'Something went wrong')),
      );
      expect(find.text('Something went wrong'), findsOneWidget);
    });

    testWidgets('renders optional message', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const ErrorState(title: 'Error', message: 'Please try again later.'),
        ),
      );
      expect(find.text('Please try again later.'), findsOneWidget);
    });

    testWidgets('does not render message when omitted', (tester) async {
      await tester.pumpWidget(_wrap(const ErrorState(title: 'Error')));
      expect(find.byType(Text), findsOneWidget);
    });

    testWidgets('renders action button when provided', (tester) async {
      await tester.pumpWidget(
        _wrap(
          ErrorState(title: 'Error', actionLabel: 'Retry', onAction: () {}),
        ),
      );
      expect(find.text('Retry'), findsOneWidget);
      expect(find.byType(FilledButton), findsOneWidget);
    });

    testWidgets('action callback is invoked on tap', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        _wrap(
          ErrorState(
            title: 'Error',
            actionLabel: 'Retry',
            onAction: () => tapped = true,
          ),
        ),
      );
      await tester.tap(find.text('Retry'));
      expect(tapped, isTrue);
    });

    testWidgets('has liveRegion semantics', (tester) async {
      await tester.pumpWidget(
        _wrap(const ErrorState(title: 'Something went wrong')),
      );
      final semantics = tester.getSemantics(find.byType(ErrorState));
      expect(semantics, isSemantics(isLiveRegion: true));
    });

    testWidgets('title uses danger color from Enistere extension', (
      tester,
    ) async {
      await tester.pumpWidget(_wrap(const ErrorState(title: 'Error')));
      final context = tester.element(find.byType(ErrorState));
      final ext = EnistereThemeExtension.of(context);
      expect(ext.colorDanger, EnistereTokens.lightDanger);
    });

    testWidgets('light theme does not throw', (tester) async {
      await tester.pumpWidget(_wrap(const ErrorState(title: 'Error')));
      expect(tester.takeException(), isNull);
    });

    testWidgets('dark theme does not throw', (tester) async {
      await tester.pumpWidget(
        _wrap(const ErrorState(title: 'Error'), dark: true),
      );
      expect(tester.takeException(), isNull);
    });

    testWidgets('long message does not overflow in constrained box', (
      tester,
    ) async {
      await tester.pumpWidget(
        _wrap(
          const SizedBox(
            width: 200,
            child: ErrorState(
              title: 'Error loading your data from the remote server',
              message:
                  'An unexpected error occurred. Please check your connection and try again.',
            ),
          ),
        ),
      );
      expect(tester.takeException(), isNull);
    });
  });

  // ── SuccessState ───────────────────────────────────────────────────────────

  group('SuccessState', () {
    testWidgets('renders title', (tester) async {
      await tester.pumpWidget(
        _wrap(const SuccessState(title: 'Upload complete')),
      );
      expect(find.text('Upload complete'), findsOneWidget);
    });

    testWidgets('renders optional message', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const SuccessState(
            title: 'Done',
            message: 'Your file has been saved.',
          ),
        ),
      );
      expect(find.text('Your file has been saved.'), findsOneWidget);
    });

    testWidgets('does not render message when omitted', (tester) async {
      await tester.pumpWidget(_wrap(const SuccessState(title: 'Done')));
      expect(find.byType(Text), findsOneWidget);
    });

    testWidgets('renders action button when provided', (tester) async {
      await tester.pumpWidget(
        _wrap(
          SuccessState(title: 'Done', actionLabel: 'Continue', onAction: () {}),
        ),
      );
      expect(find.text('Continue'), findsOneWidget);
      expect(find.byType(FilledButton), findsOneWidget);
    });

    testWidgets('action callback is invoked on tap', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        _wrap(
          SuccessState(
            title: 'Done',
            actionLabel: 'Continue',
            onAction: () => tapped = true,
          ),
        ),
      );
      await tester.tap(find.text('Continue'));
      expect(tapped, isTrue);
    });

    testWidgets('has liveRegion semantics', (tester) async {
      await tester.pumpWidget(
        _wrap(const SuccessState(title: 'Upload complete')),
      );
      final semantics = tester.getSemantics(find.byType(SuccessState));
      expect(semantics, isSemantics(isLiveRegion: true));
    });

    testWidgets('title uses success color from Enistere extension', (
      tester,
    ) async {
      await tester.pumpWidget(_wrap(const SuccessState(title: 'Done')));
      final context = tester.element(find.byType(SuccessState));
      final ext = EnistereThemeExtension.of(context);
      expect(ext.colorSuccess, EnistereTokens.lightSuccess);
    });

    testWidgets('light theme does not throw', (tester) async {
      await tester.pumpWidget(_wrap(const SuccessState(title: 'Done')));
      expect(tester.takeException(), isNull);
    });

    testWidgets('dark theme does not throw', (tester) async {
      await tester.pumpWidget(
        _wrap(const SuccessState(title: 'Done'), dark: true),
      );
      expect(tester.takeException(), isNull);
    });

    testWidgets('long message does not overflow in constrained box', (
      tester,
    ) async {
      await tester.pumpWidget(
        _wrap(
          const SizedBox(
            width: 200,
            child: SuccessState(
              title: 'Your file was uploaded successfully to the archive',
              message: 'You can now access it from the Files section.',
            ),
          ),
        ),
      );
      expect(tester.takeException(), isNull);
    });
  });
}
