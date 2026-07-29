import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'src/core/navigation/router.dart';
import 'src/theme/enistere_theme.dart';

class EnistereApp extends ConsumerWidget {
  const EnistereApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'Enistere',
      theme: EnistereTheme.light(),
      darkTheme: EnistereTheme.dark(),
      themeMode: ThemeMode.system,
      routerConfig: ref.watch(routerProvider),
    );
  }
}
