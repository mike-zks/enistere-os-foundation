import 'package:dio/dio.dart';

import 'app_api_error.dart';

AppApiError mapDioError(DioException err) {
  switch (err.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.receiveTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.transformTimeout:
      return const TimeoutError();
    case DioExceptionType.connectionError:
      return const NetworkError(message: 'Connection error');
    case DioExceptionType.cancel:
      return const NetworkError(message: 'Request cancelled');
    case DioExceptionType.badCertificate:
      return const NetworkError(message: 'Bad certificate');
    case DioExceptionType.badResponse:
    case DioExceptionType.unknown:
      break;
  }

  final statusCode = err.response?.statusCode;
  if (statusCode == null) {
    return UnknownApiError(message: err.message);
  }

  return switch (statusCode) {
    401 => const UnauthorizedError(),
    403 => const ForbiddenError(),
    404 => const NotFoundError(),
    413 => const TooLargeError(),
    415 => const UnsupportedTypeError(),
    422 => ValidationError(errors: _extractErrors(err.response?.data)),
    429 => const RateLimitedError(),
    >= 500 => ServerError(statusCode: statusCode),
    _ => UnknownApiError(statusCode: statusCode),
  };
}

Map<String, dynamic>? _extractErrors(dynamic data) {
  if (data is Map<String, dynamic>) return data;
  return null;
}

class ErrorInterceptor extends Interceptor {
  const ErrorInterceptor();

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    handler.reject(
      DioException(
        requestOptions: err.requestOptions,
        response: err.response,
        type: err.type,
        error: mapDioError(err),
        message: err.message,
        stackTrace: err.stackTrace,
      ),
    );
  }
}
