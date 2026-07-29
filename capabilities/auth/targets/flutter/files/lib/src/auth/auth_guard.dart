import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'auth_controller.dart';

const loginRoutePath = '/login';

/// Redirects an unauthenticated caller to the login page.
///
/// Client-side only, and deliberately so: this decides what to *render*, never
/// what is *allowed*. The authority remains the sole authorization on every
/// request — a guard that can be bypassed by editing a deep link must never be
/// the thing standing between a caller and data.
///
/// Install it as a `redirect` on the routes an application wants gated. The
/// baseline gates nothing, because which screens are public is a product
/// decision, not an authentication one.
String? authRedirect(Ref ref, GoRouterState state) {
  if (ref.read(authControllerProvider).isAuthenticated) return null;

  final location = state.matchedLocation;
  if (location == loginRoutePath) return null;

  // `returnTo` stays an internal path: accepting an absolute URL here would turn
  // the login page into an open redirector.
  final returnTo = location.startsWith('/') ? location : '/';
  return Uri(
    path: loginRoutePath,
    queryParameters: {'returnTo': returnTo},
  ).toString();
}
