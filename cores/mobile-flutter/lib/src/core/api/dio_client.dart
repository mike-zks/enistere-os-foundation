import 'package:dio/dio.dart';

import '../config/api_config.dart';
import 'error_interceptor.dart';
import 'logging_interceptor.dart';

typedef TokenReader = String? Function();
typedef CorrelationIdReader = String? Function();
typedef ApiLogger = void Function(String message);

Dio createDioClient({
  required ApiConfig config,
  required TokenReader tokenReader,
  CorrelationIdReader? correlationIdReader,
  ApiLogger? logger,
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
    _AuthInterceptor(
      tokenReader: tokenReader,
      correlationIdReader: correlationIdReader,
    ),
    LoggingInterceptor(log: logger),
    const ErrorInterceptor(),
  ]);

  return dio;
}

class _AuthInterceptor extends Interceptor {
  const _AuthInterceptor({required this.tokenReader, this.correlationIdReader});

  final TokenReader tokenReader;
  final CorrelationIdReader? correlationIdReader;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = tokenReader();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    final correlationId = correlationIdReader?.call();
    if (correlationId != null) {
      options.headers['X-Request-Id'] = correlationId;
    }
    handler.next(options);
  }
}
