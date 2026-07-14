import 'dart:ui' show lerpDouble;

import 'package:flutter/material.dart';

import 'enistere_tokens.dart';

class EnistereThemeExtension extends ThemeExtension<EnistereThemeExtension> {
  const EnistereThemeExtension({
    required this.spacingXs,
    required this.spacingSm,
    required this.spacingMd,
    required this.spacingLg,
    required this.spacingXl,
    required this.spacingXxl,
    required this.radiusSm,
    required this.radiusMd,
    required this.radiusLg,
    required this.radiusPill,
    required this.colorSuccess,
    required this.colorDanger,
    required this.colorTextMuted,
    required this.colorBorder,
    required this.colorSurfaceElevated,
    required this.minTouchTarget,
  });

  factory EnistereThemeExtension.light() => const EnistereThemeExtension(
    spacingXs: EnistereTokens.spacingXs,
    spacingSm: EnistereTokens.spacingSm,
    spacingMd: EnistereTokens.spacingMd,
    spacingLg: EnistereTokens.spacingLg,
    spacingXl: EnistereTokens.spacingXl,
    spacingXxl: EnistereTokens.spacingXxl,
    radiusSm: EnistereTokens.radiusSm,
    radiusMd: EnistereTokens.radiusMd,
    radiusLg: EnistereTokens.radiusLg,
    radiusPill: EnistereTokens.radiusPill,
    colorSuccess: EnistereTokens.lightSuccess,
    colorDanger: EnistereTokens.lightDanger,
    colorTextMuted: EnistereTokens.lightTextMuted,
    colorBorder: EnistereTokens.lightBorder,
    colorSurfaceElevated: EnistereTokens.lightSurfaceElevated,
    minTouchTarget: EnistereTokens.minTouchTarget,
  );

  factory EnistereThemeExtension.dark() => const EnistereThemeExtension(
    spacingXs: EnistereTokens.spacingXs,
    spacingSm: EnistereTokens.spacingSm,
    spacingMd: EnistereTokens.spacingMd,
    spacingLg: EnistereTokens.spacingLg,
    spacingXl: EnistereTokens.spacingXl,
    spacingXxl: EnistereTokens.spacingXxl,
    radiusSm: EnistereTokens.radiusSm,
    radiusMd: EnistereTokens.radiusMd,
    radiusLg: EnistereTokens.radiusLg,
    radiusPill: EnistereTokens.radiusPill,
    colorSuccess: EnistereTokens.darkSuccess,
    colorDanger: EnistereTokens.darkDanger,
    colorTextMuted: EnistereTokens.darkTextMuted,
    colorBorder: EnistereTokens.darkBorder,
    colorSurfaceElevated: EnistereTokens.darkSurfaceElevated,
    minTouchTarget: EnistereTokens.minTouchTarget,
  );

  final double spacingXs;
  final double spacingSm;
  final double spacingMd;
  final double spacingLg;
  final double spacingXl;
  final double spacingXxl;

  final double radiusSm;
  final double radiusMd;
  final double radiusLg;
  final double radiusPill;

  final Color colorSuccess;
  final Color colorDanger;
  final Color colorTextMuted;
  final Color colorBorder;
  final Color colorSurfaceElevated;

  final double minTouchTarget;

  static EnistereThemeExtension of(BuildContext context) =>
      Theme.of(context).extension<EnistereThemeExtension>()!;

  @override
  EnistereThemeExtension copyWith({
    double? spacingXs,
    double? spacingSm,
    double? spacingMd,
    double? spacingLg,
    double? spacingXl,
    double? spacingXxl,
    double? radiusSm,
    double? radiusMd,
    double? radiusLg,
    double? radiusPill,
    Color? colorSuccess,
    Color? colorDanger,
    Color? colorTextMuted,
    Color? colorBorder,
    Color? colorSurfaceElevated,
    double? minTouchTarget,
  }) {
    return EnistereThemeExtension(
      spacingXs: spacingXs ?? this.spacingXs,
      spacingSm: spacingSm ?? this.spacingSm,
      spacingMd: spacingMd ?? this.spacingMd,
      spacingLg: spacingLg ?? this.spacingLg,
      spacingXl: spacingXl ?? this.spacingXl,
      spacingXxl: spacingXxl ?? this.spacingXxl,
      radiusSm: radiusSm ?? this.radiusSm,
      radiusMd: radiusMd ?? this.radiusMd,
      radiusLg: radiusLg ?? this.radiusLg,
      radiusPill: radiusPill ?? this.radiusPill,
      colorSuccess: colorSuccess ?? this.colorSuccess,
      colorDanger: colorDanger ?? this.colorDanger,
      colorTextMuted: colorTextMuted ?? this.colorTextMuted,
      colorBorder: colorBorder ?? this.colorBorder,
      colorSurfaceElevated: colorSurfaceElevated ?? this.colorSurfaceElevated,
      minTouchTarget: minTouchTarget ?? this.minTouchTarget,
    );
  }

  @override
  EnistereThemeExtension lerp(EnistereThemeExtension? other, double t) {
    if (other == null) return this;
    return EnistereThemeExtension(
      spacingXs: lerpDouble(spacingXs, other.spacingXs, t)!,
      spacingSm: lerpDouble(spacingSm, other.spacingSm, t)!,
      spacingMd: lerpDouble(spacingMd, other.spacingMd, t)!,
      spacingLg: lerpDouble(spacingLg, other.spacingLg, t)!,
      spacingXl: lerpDouble(spacingXl, other.spacingXl, t)!,
      spacingXxl: lerpDouble(spacingXxl, other.spacingXxl, t)!,
      radiusSm: lerpDouble(radiusSm, other.radiusSm, t)!,
      radiusMd: lerpDouble(radiusMd, other.radiusMd, t)!,
      radiusLg: lerpDouble(radiusLg, other.radiusLg, t)!,
      radiusPill: lerpDouble(radiusPill, other.radiusPill, t)!,
      colorSuccess: Color.lerp(colorSuccess, other.colorSuccess, t)!,
      colorDanger: Color.lerp(colorDanger, other.colorDanger, t)!,
      colorTextMuted: Color.lerp(colorTextMuted, other.colorTextMuted, t)!,
      colorBorder: Color.lerp(colorBorder, other.colorBorder, t)!,
      colorSurfaceElevated: Color.lerp(
        colorSurfaceElevated,
        other.colorSurfaceElevated,
        t,
      )!,
      minTouchTarget: lerpDouble(minTouchTarget, other.minTouchTarget, t)!,
    );
  }
}
