import 'package:go_router/go_router.dart';

import '../../features/home/home_screen.dart';

abstract final class AppRoutes {
  static const home = '/';
}

final routerProvider = GoRouter(
  routes: [
    GoRoute(
      path: AppRoutes.home,
      name: 'home',
      builder: (context, state) => const HomeScreen(),
    ),
  ],
);
