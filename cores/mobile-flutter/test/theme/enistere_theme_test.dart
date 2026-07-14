import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/theme/enistere_theme.dart';
import 'package:mobile_flutter/src/theme/enistere_theme_extension.dart';
import 'package:mobile_flutter/src/theme/enistere_tokens.dart';

void main() {
  group('EnistereTheme', () {
    group('useMaterial3', () {
      test('light theme uses Material 3', () {
        expect(EnistereTheme.light().useMaterial3, isTrue);
      });

      test('dark theme uses Material 3', () {
        expect(EnistereTheme.dark().useMaterial3, isTrue);
      });
    });

    group('ColorScheme — primary', () {
      test('light primary matches token', () {
        expect(
          EnistereTheme.light().colorScheme.primary,
          equals(EnistereTokens.lightPrimary),
        );
      });

      test('dark primary matches token', () {
        expect(
          EnistereTheme.dark().colorScheme.primary,
          equals(EnistereTokens.darkPrimary),
        );
      });
    });

    group('ColorScheme — surface / text', () {
      test('light surface matches background token', () {
        expect(
          EnistereTheme.light().colorScheme.surface,
          equals(EnistereTokens.lightBackground),
        );
      });

      test('dark surface matches background token', () {
        expect(
          EnistereTheme.dark().colorScheme.surface,
          equals(EnistereTokens.darkBackground),
        );
      });

      test('light onSurface matches text token', () {
        expect(
          EnistereTheme.light().colorScheme.onSurface,
          equals(EnistereTokens.lightText),
        );
      });
    });

    group('ColorScheme — error', () {
      test('light error matches danger token', () {
        expect(
          EnistereTheme.light().colorScheme.error,
          equals(EnistereTokens.lightDanger),
        );
      });

      test('dark error matches danger token', () {
        expect(
          EnistereTheme.dark().colorScheme.error,
          equals(EnistereTokens.darkDanger),
        );
      });
    });

    group('EnistereThemeExtension', () {
      test('light theme contains extension', () {
        final ext = EnistereTheme.light().extension<EnistereThemeExtension>();
        expect(ext, isNotNull);
      });

      test('dark theme contains extension', () {
        final ext = EnistereTheme.dark().extension<EnistereThemeExtension>();
        expect(ext, isNotNull);
      });

      test('spacingMd is 16', () {
        final ext = EnistereTheme.light().extension<EnistereThemeExtension>()!;
        expect(ext.spacingMd, equals(16.0));
      });

      test('radiusMd is 8', () {
        final ext = EnistereTheme.light().extension<EnistereThemeExtension>()!;
        expect(ext.radiusMd, equals(8.0));
      });

      test('minTouchTarget is 44', () {
        final ext = EnistereTheme.light().extension<EnistereThemeExtension>()!;
        expect(ext.minTouchTarget, equals(44.0));
      });

      test('light success color matches token', () {
        final ext = EnistereTheme.light().extension<EnistereThemeExtension>()!;
        expect(ext.colorSuccess, equals(EnistereTokens.lightSuccess));
      });

      test('dark success color matches token', () {
        final ext = EnistereTheme.dark().extension<EnistereThemeExtension>()!;
        expect(ext.colorSuccess, equals(EnistereTokens.darkSuccess));
      });
    });
  });
}
