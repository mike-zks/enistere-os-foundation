import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/dio_client.dart';
import '../../core/api/dio_provider.dart';
import 'auth_errors.dart';
import 'auth_session.dart';

/// Talks to the authority. Holds no state and decides nothing about sessions.
///
/// Left implementable on purpose: the controller's guarantees are about what it
/// does when the transport misbehaves, and a test can only express that by
/// substituting one that does.
class AuthApi {
  const AuthApi(this._transport);

  final Dio _transport;

  Future<AuthSession> login(String email, String password) => _exchange(
    '/api/v1/auth/login',
    {'email': email, 'password': password},
    genericCredentialsMessage,
  );

  Future<AuthSession> refresh(String refreshToken) => _exchange(
    '/api/v1/auth/refresh',
    {'refreshToken': refreshToken},
    genericUnavailableMessage,
  );

  /// Best-effort remote revocation. The caller purges locally whatever happens:
  /// an unreachable authority must never trap a user in a signed-in state.
  Future<void> logout(String refreshToken) async {
    try {
      await _transport.post<Map<String, dynamic>>(
        '/api/v1/auth/logout',
        data: {'refreshToken': refreshToken},
      );
    } catch (_) {
      // Deliberately swallowed — see the contract above. The guarantee itself
      // lives in AuthController.signOut, not here, so that swapping this
      // transport cannot silently remove it.
    }
  }

  Future<AuthSession> _exchange(
    String path,
    Map<String, dynamic> body,
    String failureMessage,
  ) async {
    try {
      final response = await _transport.post<Map<String, dynamic>>(
        path,
        data: body,
      );
      return AuthSession.fromJson(response.data ?? const <String, dynamic>{});
    } catch (error) {
      // The response body may carry the reason; it is never surfaced. Only the
      // correlation id crosses.
      throw AuthError(failureMessage, requestId: _requestIdOf(error));
    }
  }
}

String? _requestIdOf(Object error) {
  if (error is! DioException) return null;
  final body = error.response?.data;
  if (body is! Map) return null;
  final requestId = body['requestId'];
  return requestId is String ? requestId : null;
}

/// Transport used by authentication itself, and by the single retry that follows
/// a refresh.
///
/// Deliberately a *separate* client carrying no authentication interceptor:
/// sending a refresh through the interceptor that triggered it is how a client
/// loops against its own authority. Separation makes that loop unrepresentable
/// rather than merely guarded against.
final authTransportProvider = Provider<Dio>(
  (ref) => createDioClient(config: ref.watch(apiConfigProvider)),
);

final authApiProvider = Provider<AuthApi>(
  (ref) => AuthApi(ref.watch(authTransportProvider)),
);
