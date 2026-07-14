import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/app.dart';
import 'package:mobile_flutter/src/features/home/home_screen.dart';

void main() {
  group('EnistereApp', () {
    testWidgets('builds without error', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: EnistereApp()));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });

    testWidgets('renders HomeScreen', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: EnistereApp()));
      await tester.pumpAndSettle();
      expect(find.byType(HomeScreen), findsOneWidget);
    });

    testWidgets('displays app title in AppBar', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: EnistereApp()));
      await tester.pumpAndSettle();
      expect(find.text('Enistere'), findsOneWidget);
    });

    testWidgets('theme is applied — primary color from tokens', (tester) async {
      await tester.pumpWidget(const ProviderScope(child: EnistereApp()));
      await tester.pumpAndSettle();
      final context = tester.element(find.byType(HomeScreen));
      final primary = Theme.of(context).colorScheme.primary;
      expect(primary, equals(const Color(0xFF2563EB)));
    });
  });
}
