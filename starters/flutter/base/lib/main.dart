import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';

void main() {
  // ProviderScope hosts the base API providers (dio client, config). ADR-053.
  runApp(const ProviderScope(child: EnistereApp()));
}
