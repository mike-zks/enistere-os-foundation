import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'auth_api.dart';
import 'auth_controller.dart';

/// Marks a request that has already spent its single retry.
const authRetriedFlag = 'enistere.auth.retried';

/// Attaches the access token and recovers from a single expiry.
///
/// Composed BEFORE the baseline error mapping — see `createDioClient`. That
/// mapping is terminal (`handler.reject` ends the chain), so an interceptor
/// placed after it would never observe a 401 and could never recover from one.
final class AuthInterceptor extends Interceptor {
  AuthInterceptor(this._ref);

  final Ref _ref;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final token = _ref.read(authControllerProvider.notifier).accessToken;
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final options = err.requestOptions;
    if (err.response?.statusCode != 401 ||
        options.extra[authRetriedFlag] == true) {
      handler.next(err);
      return;
    }

    final token = await _ref.read(authControllerProvider.notifier).refresh();
    if (token == null) {
      // No usable session left. The original 401 must reach the caller rather
      // than a retry against an authority that just refused.
      handler.next(err);
      return;
    }

    // Exactly one retry, marked on the request itself. A second 401 carrying a
    // fresh token means the session is genuinely gone, and retrying again would
    // only loop against the authority.
    options.extra[authRetriedFlag] = true;
    options.headers['Authorization'] = 'Bearer $token';
    try {
      handler.resolve(await _ref.read(authTransportProvider).fetch(options));
    } on DioException catch (error) {
      handler.next(error);
    }
  }
}

/// Factory consumed by the `flutter.interceptor` composition seam.
Interceptor authInterceptorFactory(Ref ref) => AuthInterceptor(ref);
