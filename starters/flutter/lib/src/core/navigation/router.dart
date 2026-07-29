import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/home/home_screen.dart';
import '../composition/capability_routes.dart';

abstract final class AppRoutes {
  static const home = '/';
}

/// The application router, as a real provider.
///
/// It used to be a top-level constant that merely *looked* like a provider. The
/// difference matters: a route guard has to be able to ask something about the
/// application's state, and a constant can ask nothing. Exposing [Ref] here is
/// what lets a composed capability install a redirect at all.
final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    routes: [
      GoRoute(
        path: AppRoutes.home,
        name: 'home',
        builder: (context, state) => const HomeScreen(),
      ),
      ...capabilityRoutes,
    ],
  );
});
