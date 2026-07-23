sealed class AppApiError implements Exception {
  const AppApiError();
}

final class NetworkError extends AppApiError {
  const NetworkError({this.message});
  final String? message;
}

final class TimeoutError extends AppApiError {
  const TimeoutError();
}

final class UnauthorizedError extends AppApiError {
  const UnauthorizedError();
}

final class ForbiddenError extends AppApiError {
  const ForbiddenError();
}

final class NotFoundError extends AppApiError {
  const NotFoundError();
}

final class ValidationError extends AppApiError {
  const ValidationError({this.errors});
  final Map<String, dynamic>? errors;
}

final class TooLargeError extends AppApiError {
  const TooLargeError();
}

final class UnsupportedTypeError extends AppApiError {
  const UnsupportedTypeError();
}

final class RateLimitedError extends AppApiError {
  const RateLimitedError();
}

final class ServerError extends AppApiError {
  const ServerError({this.statusCode});
  final int? statusCode;
}

final class UnknownApiError extends AppApiError {
  const UnknownApiError({this.statusCode, this.message});
  final int? statusCode;
  final String? message;
}
