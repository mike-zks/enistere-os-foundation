import 'package:dio/dio.dart';

import '../config/api_config.dart';
import 'error_interceptor.dart';
import 'logging_interceptor.dart';

typedef ApiLogger = void Function(String message);

/// Base Dio client (ADR-053): assembles structured request logging and canonical
/// error mapping only. The Auth capability overlays the token/refresh
/// interceptors on top of this base client.
///
/// Interceptor order: logging → canonical error mapping. In Dio 5.x, errors flow
/// in registration order via catchError chaining, so logging observes the raw
/// error before ErrorInterceptor maps it to an [AppApiError] and terminates.
Dio createDioClient({required ApiConfig config, ApiLogger? logger}) {
  final dio = Dio(
    BaseOptions(
      baseUrl: config.baseUrl,
      connectTimeout: Duration(milliseconds: config.connectTimeoutMs),
      receiveTimeout: Duration(milliseconds: config.receiveTimeoutMs),
      sendTimeout: Duration(milliseconds: config.sendTimeoutMs),
      headers: Map<String, String>.from(config.commonHeaders),
    ),
  );

  dio.interceptors.addAll([
    LoggingInterceptor(log: logger),
    const ErrorInterceptor(),
  ]);

  return dio;
}
