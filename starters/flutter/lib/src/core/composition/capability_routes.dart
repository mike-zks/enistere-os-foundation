// Point d'intégration central des capabilities (contrat de composition Factory).
//
// Ce fichier est REMPLACÉ par la Factory lors d'une génération composée : les
// overlays déclarent leurs routes via l'intégration connue `flutter.route`.
import 'package:go_router/go_router.dart';

/// Routes apportées par les capabilities composées, triées par `order`.
final List<RouteBase> capabilityRoutes = <RouteBase>[];
