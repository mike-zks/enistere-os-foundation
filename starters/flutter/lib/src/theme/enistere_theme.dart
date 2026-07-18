import 'package:flutter/material.dart';

import 'enistere_theme_extension.dart';
import 'enistere_tokens.dart';

abstract final class EnistereTheme {
  static ThemeData light() {
    final colorScheme = const ColorScheme(
      brightness: Brightness.light,
      primary: EnistereTokens.lightPrimary,
      onPrimary: EnistereTokens.lightPrimaryText,
      secondary: EnistereTokens.lightPrimary,
      onSecondary: EnistereTokens.lightPrimaryText,
      error: EnistereTokens.lightDanger,
      onError: EnistereTokens.lightPrimaryText,
      surface: EnistereTokens.lightBackground,
      onSurface: EnistereTokens.lightText,
      onSurfaceVariant: EnistereTokens.lightTextMuted,
      outline: EnistereTokens.lightBorder,
      outlineVariant: EnistereTokens.lightBorder,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      textTheme: _buildTextTheme(EnistereTokens.lightText),
      extensions: [EnistereThemeExtension.light()],
    );
  }

  static ThemeData dark() {
    final colorScheme = const ColorScheme(
      brightness: Brightness.dark,
      primary: EnistereTokens.darkPrimary,
      onPrimary: EnistereTokens.darkPrimaryText,
      secondary: EnistereTokens.darkPrimary,
      onSecondary: EnistereTokens.darkPrimaryText,
      error: EnistereTokens.darkDanger,
      onError: EnistereTokens.darkPrimaryText,
      surface: EnistereTokens.darkBackground,
      onSurface: EnistereTokens.darkText,
      onSurfaceVariant: EnistereTokens.darkTextMuted,
      outline: EnistereTokens.darkBorder,
      outlineVariant: EnistereTokens.darkBorder,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      textTheme: _buildTextTheme(EnistereTokens.darkText),
      extensions: [EnistereThemeExtension.dark()],
    );
  }

  static TextTheme _buildTextTheme(Color textColor) {
    return TextTheme(
      headlineLarge: TextStyle(
        fontSize: EnistereTokens.fontSizeHeading,
        fontWeight: EnistereTokens.fontWeightHeading,
        color: textColor,
      ),
      headlineMedium: TextStyle(
        fontSize: EnistereTokens.fontSizeHeading,
        fontWeight: EnistereTokens.fontWeightHeading,
        color: textColor,
      ),
      titleLarge: TextStyle(
        fontSize: EnistereTokens.fontSizeTitle,
        fontWeight: EnistereTokens.fontWeightTitle,
        color: textColor,
      ),
      bodyLarge: TextStyle(
        fontSize: EnistereTokens.fontSizeBody,
        fontWeight: EnistereTokens.fontWeightBody,
        color: textColor,
      ),
      bodyMedium: TextStyle(
        fontSize: EnistereTokens.fontSizeBody,
        fontWeight: EnistereTokens.fontWeightBody,
        color: textColor,
      ),
      labelSmall: TextStyle(
        fontSize: EnistereTokens.fontSizeCaption,
        fontWeight: EnistereTokens.fontWeightCaption,
        color: textColor,
      ),
    );
  }
}
