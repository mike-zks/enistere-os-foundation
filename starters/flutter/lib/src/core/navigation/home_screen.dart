import 'package:flutter/material.dart';

import '../../theme/enistere_theme_extension.dart';

/// The baseline landing surface, and core code despite its former filename.
///
/// It used to live under `lib/src/features/home/`, which made the router — core
/// — import the business zone. The zone follows the nature of the code
/// (ADR-079): this screen names no domain, holds no session and calls nothing.
/// Its React Native counterpart, `app/index.tsx`, is a starter surface for the
/// same reason.
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ext = EnistereThemeExtension.of(context);
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Enistere')),
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
          ],
        ),
      ),
    );
  }
}
