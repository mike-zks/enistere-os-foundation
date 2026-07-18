import 'package:flutter/material.dart';

import '../../theme/enistere_theme_extension.dart';

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    this.description,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String? description;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final ext = EnistereThemeExtension.of(context);
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: EdgeInsets.all(ext.spacingLg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              title,
              style: theme.textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            if (description != null) ...[
              SizedBox(height: ext.spacingSm),
              Text(
                description!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: ext.colorTextMuted,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (actionLabel != null && onAction != null) ...[
              SizedBox(height: ext.spacingMd),
              OutlinedButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
  }
}
