import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/api_config.dart';
import 'dio_client.dart';

/// Base API config (ADR-053) — relative URLs by default; override per environment.
final apiConfigProvider = Provider<ApiConfig>(
  (ref) => const ApiConfig(baseUrl: ''),
);

/// Base Dio client provider: structured logging + canonical error mapping, no
/// auth. The Auth capability replaces this provider with a token/refresh-aware
/// client built on the same base.
final dioClientProvider = Provider<Dio>((ref) {
  final config = ref.read(apiConfigProvider);
  return createDioClient(config: config);
});
