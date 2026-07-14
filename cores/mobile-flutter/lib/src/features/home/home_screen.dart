import 'package:flutter/material.dart';

import '../../theme/enistere_theme_extension.dart';

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
            Text('Mobile Core Flutter', style: textTheme.headlineMedium),
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
