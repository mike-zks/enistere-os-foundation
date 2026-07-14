import 'package:dio/dio.dart';

// Logs method + path only — never body, headers, tokens, or query params that
// may carry signed URLs or bearer values.
class LoggingInterceptor extends Interceptor {
  const LoggingInterceptor({this.log});

  final void Function(String message)? log;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    log?.call('→ ${options.method} ${options.uri.path}');
    handler.next(options);
  }

  @override
  void onResponse(
    Response<dynamic> response,
    ResponseInterceptorHandler handler,
  ) {
    log?.call('← ${response.statusCode} ${response.requestOptions.uri.path}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final statusCode = err.response?.statusCode;
    final path = err.requestOptions.uri.path;
    if (statusCode != null) {
      log?.call('✗ $statusCode $path');
    } else {
      log?.call('✗ ${err.type.name} $path');
    }
    handler.next(err);
  }
}
