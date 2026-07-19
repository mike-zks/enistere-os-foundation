import 'package:flutter/material.dart';

import '../../theme/enistere_theme_extension.dart';

class LoadingState extends StatelessWidget {
  const LoadingState({super.key, this.message});

  final String? message;

  @override
  Widget build(BuildContext context) {
    final ext = EnistereThemeExtension.of(context);
    final message = this.message;
    return Semantics(
      label: message ?? 'Loading',
      child: Center(
        child: Padding(
          padding: EdgeInsets.all(ext.spacingLg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(
                color: Theme.of(context).colorScheme.primary,
              ),
              if (message != null) ...[
                SizedBox(height: ext.spacingMd),
                Text(
                  message,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: ext.colorTextMuted),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
