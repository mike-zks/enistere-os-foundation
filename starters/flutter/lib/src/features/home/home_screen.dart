import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/auth/auth_controller.dart';
import '../../theme/enistere_theme_extension.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ext = EnistereThemeExtension.of(context);
    final textTheme = Theme.of(context).textTheme;
    final authState = ref.watch(authControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Enistere'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Se déconnecter',
            onPressed: () =>
                ref.read(authControllerProvider.notifier).signOut(),
          ),
        ],
      ),
      body: Padding(
        padding: EdgeInsets.all(ext.spacingMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('starter Flutter', style: textTheme.headlineMedium),
            SizedBox(height: ext.spacingSm),
            Text(
              'Starter minimal — ADR-034',
              style: textTheme.bodyMedium?.copyWith(color: ext.colorTextMuted),
            ),
            if (authState.userId != null) ...[
              SizedBox(height: ext.spacingSm),
              Text(
                'Session : ${authState.userId}',
                style: textTheme.bodyMedium,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
