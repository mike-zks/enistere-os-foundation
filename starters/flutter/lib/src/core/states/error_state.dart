import 'package:flutter/material.dart';

import '../../theme/enistere_theme_extension.dart';

class ErrorState extends StatelessWidget {
  const ErrorState({
    super.key,
    required this.title,
    this.message,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String? message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final ext = EnistereThemeExtension.of(context);
    final theme = Theme.of(context);
    return Semantics(
      liveRegion: true,
      child: Center(
        child: Padding(
          padding: EdgeInsets.all(ext.spacingLg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                style: theme.textTheme.titleLarge?.copyWith(
                  color: ext.colorDanger,
                ),
                textAlign: TextAlign.center,
              ),
              if (message != null) ...[
                SizedBox(height: ext.spacingSm),
                Text(
                  message!,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: ext.colorTextMuted,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
              if (actionLabel != null && onAction != null) ...[
                SizedBox(height: ext.spacingMd),
                FilledButton(onPressed: onAction, child: Text(actionLabel!)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
