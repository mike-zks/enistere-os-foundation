import 'auth_status.dart';

class AuthState {
  const AuthState({required this.status, this.userId});

  final AuthStatus status;

  // Opaque session identifier only — never an access token or credential.
  final String? userId;

  bool get isLoading => status == AuthStatus.loading;
  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isUnauthenticated => status == AuthStatus.unauthenticated;
  bool get isExpired => status == AuthStatus.expired;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AuthState &&
          runtimeType == other.runtimeType &&
          status == other.status &&
          userId == other.userId;

  @override
  int get hashCode => Object.hash(status, userId);

  @override
  String toString() => 'AuthState(status: $status, userId: $userId)';
}
