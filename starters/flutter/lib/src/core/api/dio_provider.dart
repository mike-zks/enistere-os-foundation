import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../auth/auth_controller.dart';
import '../config/api_config.dart';
import 'dio_client.dart';

final apiConfigProvider = Provider<ApiConfig>(
  (ref) => const ApiConfig(baseUrl: 'http://localhost:3000'),
);

final dioClientProvider = Provider<Dio>((ref) {
  final config = ref.read(apiConfigProvider);
  final controller = ref.read(authControllerProvider.notifier);
  return createDioClient(
    config: config,
    tokenReader: () => controller.accessToken,
    refresher: controller.refreshSession,
  );
});
