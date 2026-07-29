import 'package:dio/dio.dart';

import '../config/api_config.dart';
import 'error_interceptor.dart';
import 'logging_interceptor.dart';

typedef ApiLogger = void Function(String message);

/// Base Dio client (ADR-053): assembles structured request logging and canonical
/// error mapping only.
///
/// Interceptor order is a contract, not an accident:
///
///     logging → capability interceptors → canonical error mapping
///
/// Logging comes first so it observes the raw exchange. Capability interceptors
/// come next because [ErrorInterceptor] is *terminal*: it calls `handler.reject`,
/// which ends the chain. An interceptor composed after it would never observe a
/// 401 and could never recover from one. Error mapping stays last so whatever no
/// capability recovered from still reaches the caller as an `AppApiError`.
Dio createDioClient({
  required ApiConfig config,
  ApiLogger? logger,
  List<Interceptor> capabilityInterceptors = const <Interceptor>[],
}) {
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
    ...capabilityInterceptors,
    const ErrorInterceptor(),
  ]);

  return dio;
}
