import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/auth/auth_controller.dart';
import '../../theme/enistere_theme_extension.dart';

class SignInScreen extends ConsumerWidget {
  const SignInScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ext = EnistereThemeExtension.of(context);
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      body: Padding(
        padding: EdgeInsets.all(ext.spacingMd),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Enistere',
              style: textTheme.headlineMedium,
              textAlign: TextAlign.center,
            ),
            SizedBox(height: ext.spacingXl),
            SizedBox(
              height: ext.minTouchTarget,
              child: FilledButton(
                onPressed: () => ref
                    .read(authControllerProvider.notifier)
                    .signIn('user@example.com', 'password'),
                child: const Text('Se connecter'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
