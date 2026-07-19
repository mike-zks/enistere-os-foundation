import 'package:flutter/material.dart';
import 'src/core/navigation/router.dart';
import 'src/theme/enistere_theme.dart';

class EnistereApp extends StatelessWidget {
  const EnistereApp({super.key});

  @override
  Widget build(BuildContext context) {
    final router = routerProvider;
    return MaterialApp.router(
      title: 'Enistere',
      theme: EnistereTheme.light(),
      darkTheme: EnistereTheme.dark(),
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
}
