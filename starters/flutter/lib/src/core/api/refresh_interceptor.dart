import 'package:dio/dio.dart';

import 'dio_client.dart';

// Intercepts 401 responses, delegates refresh to [refresher], then retries
// the original request exactly once with the new access token.
//
// Guards:
// - Only 401 is intercepted — 403 and all other errors pass through unchanged.
// - The retry request is tagged [_kRefreshed] in `extra` to prevent looping:
//   if the retry itself returns 401, the error is surfaced immediately.
// - If [refresher] returns null (no refresh token / auth failure), the
//   original 401 is surfaced to the next interceptor (ErrorInterceptor maps
//   it to UnauthorizedError).
//
// Interceptor chain order (registration order):
//   _AuthInterceptor → LoggingInterceptor → RefreshInterceptor → ErrorInterceptor
//
// In Dio 5.x, errors flow in FORWARD (registration) order. handler.next(err)
// passes to the next interceptor; handler.reject() terminates the chain.
// RefreshInterceptor is registered before ErrorInterceptor so it sees the
// raw 401 and can refresh+retry before ErrorInterceptor maps it to UnauthorizedError.
class RefreshInterceptor extends Interceptor {
  RefreshInterceptor({required this.dio, required this.refresher});

  final Dio dio;
  final TokenRefresher refresher;

  static const _kRefreshed = '_refreshed';

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    final statusCode = err.response?.statusCode;

    // Only intercept 401. Pass 403, 5xx, and network errors through unchanged.
    if (statusCode != 401) {
      handler.next(err);
      return;
    }

    // Prevent retry loop: the retried request returned 401 again.
    if (err.requestOptions.extra[_kRefreshed] == true) {
      handler.next(err);
      return;
    }

    // Delegate to AuthController.refreshSession() — coalesced across concurrent
    // 401s by AuthController's _refreshFuture guard.
    // Catch any unexpected exception from the refresher (e.g. network error
    // in a bare refresher callable) and treat it as a refresh failure.
    String? newToken;
    try {
      newToken = await refresher();
    } catch (_) {
      handler.next(err);
      return;
    }
    if (newToken == null) {
      // Refresh failed or no refresh token — surface the 401.
      handler.next(err);
      return;
    }

    // Tag the retry to prevent infinite loops; _AuthInterceptor will inject
    // the fresh Authorization header on the next request cycle.
    err.requestOptions.extra[_kRefreshed] = true;

    try {
      final response = await dio.fetch<dynamic>(err.requestOptions);
      handler.resolve(response);
    } on DioException catch (retryErr) {
      handler.next(retryErr);
    }
  }
}
