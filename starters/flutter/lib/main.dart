import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'src/core/composition/capability_overrides.dart';

void main() {
  // ProviderScope hosts the base API providers (dio client, config). ADR-053.
  // Les surcharges des capabilities composées s'appliquent ici : c'est le seul
  // endroit où une capability peut remplacer un provider de base sans dupliquer
  // le fichier qui le déclare.
  runApp(
    ProviderScope(overrides: capabilityOverrides, child: const EnistereApp()),
  );
}
