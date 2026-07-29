import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../composition/capability_interceptors.dart';
import '../config/api_config.dart';
import 'dio_client.dart';

/// Base API config (ADR-053) — relative URLs by default; override per environment.
final apiConfigProvider = Provider<ApiConfig>(
  (ref) => const ApiConfig(baseUrl: ''),
);

/// Base Dio client provider: structured logging + canonical error mapping, with
/// the composed capability interceptors slotted between the two — see
/// [createDioClient] for why that position is the only correct one.
///
/// Capabilities are composed into this client rather than replacing it: two
/// capabilities each wanting an interceptor would otherwise fight over one
/// exclusive provider override.
final dioClientProvider = Provider<Dio>((ref) {
  final config = ref.read(apiConfigProvider);
  return createDioClient(
    config: config,
    capabilityInterceptors: [
      for (final factory in capabilityInterceptors) factory(ref),
    ],
  );
});
