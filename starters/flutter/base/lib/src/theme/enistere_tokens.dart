import 'package:flutter/painting.dart';

abstract final class EnistereTokens {
  // -- Colors Light --
  static const Color lightPrimary = Color(0xFF2563EB);
  static const Color lightBackground = Color(0xFFFFFFFF);
  static const Color lightSurface = Color(0xFFF8FAFC);
  static const Color lightSurfaceElevated = Color(0xFFFFFFFF);
  static const Color lightBorder = Color(0xFFE2E8F0);
  static const Color lightText = Color(0xFF0F172A);
  static const Color lightTextMuted = Color(0xFF64748B);
  static const Color lightPrimaryText = Color(0xFFFFFFFF);
  static const Color lightDanger = Color(0xFFDC2626);
  static const Color lightSuccess = Color(0xFF16A34A);

  // -- Colors Dark --
  static const Color darkPrimary = Color(0xFF3B82F6);
  static const Color darkBackground = Color(0xFF020617);
  static const Color darkSurface = Color(0xFF0F172A);
  static const Color darkSurfaceElevated = Color(0xFF1E293B);
  static const Color darkBorder = Color(0xFF334155);
  static const Color darkText = Color(0xFFF8FAFC);
  static const Color darkTextMuted = Color(0xFF94A3B8);
  static const Color darkPrimaryText = Color(0xFFFFFFFF);
  static const Color darkDanger = Color(0xFFEF4444);
  static const Color darkSuccess = Color(0xFF22C55E);

  // -- Spacing (dp) --
  static const double spacingXs = 4;
  static const double spacingSm = 8;
  static const double spacingMd = 16;
  static const double spacingLg = 24;
  static const double spacingXl = 32;
  static const double spacingXxl = 48;

  // -- Radius (dp) --
  static const double radiusSm = 4;
  static const double radiusMd = 8;
  static const double radiusLg = 12;
  static const double radiusPill = 9999;

  // -- Typography --
  static const double fontSizeHeading = 30;
  static const double fontSizeTitle = 20;
  static const double fontSizeBody = 16;
  static const double fontSizeCaption = 12;

  static const FontWeight fontWeightHeading = FontWeight.w700;
  static const FontWeight fontWeightTitle = FontWeight.w600;
  static const FontWeight fontWeightBody = FontWeight.w400;
  static const FontWeight fontWeightCaption = FontWeight.w400;

  // -- Touch target --
  static const double minTouchTarget = 44;
}
