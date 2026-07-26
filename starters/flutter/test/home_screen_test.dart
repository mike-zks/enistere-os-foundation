import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/features/home/home_screen.dart';
import 'package:mobile_flutter/src/theme/enistere_theme.dart';

void main() {
  testWidgets('renders the neutral runtime without Auth controls', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(theme: EnistereTheme.light(), home: const HomeScreen()),
    );

    expect(find.text('Enistere'), findsOneWidget);
    expect(find.text('starter Flutter'), findsOneWidget);
    expect(find.byTooltip('Se déconnecter'), findsNothing);
  });
}
