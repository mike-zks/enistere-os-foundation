// Point d'intégration central des capabilities (contrat de composition Factory).
//
// Ce fichier est REMPLACÉ par la Factory lors d'une génération composée : les
// overlays déclarent leurs surcharges via l'intégration connue
// `flutter.provider-override` et la Factory régénère ce fichier de manière
// déterministe. La baseline n'apporte aucune surcharge.
// `Override` vit dans misc.dart depuis Riverpod 3 : l'entrée principale ne
// l'exporte pas.
import 'package:flutter_riverpod/misc.dart';

/// Surcharges de providers apportées par les capabilities composées.
final List<Override> capabilityOverrides = <Override>[];
