import 'package:dio/dio.dart';

import '../config/api_config.dart';
import 'error_interceptor.dart';
import 'logging_interceptor.dart';
import 'refresh_interceptor.dart';

typedef TokenReader = String? Function();
typedef CorrelationIdReader = String? Function();
typedef ApiLogger = void Function(String message);
typedef TokenRefresher = Future<String?> Function();

Dio createDioClient({
  required ApiConfig config,
  required TokenReader tokenReader,
  CorrelationIdReader? correlationIdReader,
  ApiLogger? logger,
  TokenRefresher? refresher,
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

  // Interceptor registration order matters:
  //   _AuthInterceptor → LoggingInterceptor → RefreshInterceptor → ErrorInterceptor
  //
  // In Dio 5.x, errors flow in FORWARD (registration) order via catchError chaining.
  // handler.next(err) passes to the next catchError; handler.reject() terminates the
  // chain. RefreshInterceptor must come BEFORE ErrorInterceptor so it intercepts the
  // raw 401 before ErrorInterceptor maps it to UnauthorizedError and terminates.
  dio.interceptors.addAll([
    _AuthInterceptor(
      tokenReader: tokenReader,
      correlationIdReader: correlationIdReader,
    ),
    LoggingInterceptor(log: logger),
    if (refresher != null) RefreshInterceptor(dio: dio, refresher: refresher),
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
