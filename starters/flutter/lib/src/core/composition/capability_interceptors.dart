// Point d'intégration central des capabilities (contrat de composition Factory).
//
// Ce fichier est REMPLACÉ par la Factory lors d'une génération composée : les
// overlays déclarent leurs intercepteurs via `flutter.interceptor`.
//
// L'ordre compte : la journalisation observe l'échange brut, les intercepteurs
// des capabilities viennent ensuite (triés par `order`), et le mapping d'erreur
// canonique reste EN DERNIER. Il est terminal — il appelle `handler.reject`, ce
// qui clôt la chaîne : un intercepteur posé après lui ne verrait jamais un 401.
//
// Une couture plutôt qu'une surcharge du client Dio : deux capabilités voulant
// chacune un intercepteur se disputeraient la même surcharge exclusive.
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Fabrique d'intercepteur : reçoit le `Ref` pour lire les providers dont elle dépend.
typedef CapabilityInterceptorFactory = Interceptor Function(Ref ref);

/// Intercepteurs apportés par les capabilities composées.
final List<CapabilityInterceptorFactory> capabilityInterceptors =
    <CapabilityInterceptorFactory>[];
