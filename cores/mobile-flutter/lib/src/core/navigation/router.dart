import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../auth/auth_controller.dart';
import '../auth/auth_state.dart';
import '../../features/auth/sign_in_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/splash/splash_screen.dart';

abstract final class AppRoutes {
  static const splash = '/';
  static const signIn = '/sign-in';
  static const home = '/home';
}

// Bridge: Riverpod AuthState → Listenable for GoRouter.refreshListenable.
// Uses ref.listen so the routerProvider itself is NOT rebuilt on auth changes;
// GoRouter re-evaluates redirect internally via the refreshListenable mechanism.
final routerProvider = Provider<GoRouter>((ref) {
  final listenable = ValueNotifier<AuthState>(ref.read(authControllerProvider));

  ref.listen<AuthState>(authControllerProvider, (_, next) {
    listenable.value = next;
  });
  ref.onDispose(listenable.dispose);

  return GoRouter(
    initialLocation: AppRoutes.splash,
    refreshListenable: listenable,
    redirect: (context, state) =>
        _redirect(listenable.value, state.matchedLocation),
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.signIn,
        name: 'signIn',
        builder: (context, state) => const SignInScreen(),
      ),
      GoRoute(
        path: AppRoutes.home,
        name: 'home',
        builder: (context, state) => const HomeScreen(),
      ),
    ],
  );
});

String? _redirect(AuthState authState, String location) {
  if (authState.isLoading) {
    return location == AppRoutes.splash ? null : AppRoutes.splash;
  }
  if (authState.isAuthenticated) {
    final onPublic =
        location == AppRoutes.splash || location == AppRoutes.signIn;
    return onPublic ? AppRoutes.home : null;
  }
  // unauthenticated or expired
  return location == AppRoutes.signIn ? null : AppRoutes.signIn;
}
