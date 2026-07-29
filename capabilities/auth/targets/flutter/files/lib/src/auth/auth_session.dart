/// Public identity carried with a session. Never holds secret material.
final class AuthUser {
  const AuthUser({required this.id, required this.email, required this.status});

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    final email = json['email'];
    final status = json['status'];
    if (id is! String || email is! String || status is! String) {
      throw const FormatException('Malformed authentication identity.');
    }
    return AuthUser(id: id, email: email, status: status);
  }

  final String id;
  final String email;
  final String status;
}

/// What the authority returns on login and on refresh (ADR-068 canonical shape).
///
/// Parsing is strict on the two fields the client cannot function without. A
/// malformed answer must fail here, as a session that never existed, rather than
/// half-populate a controller that would then look authenticated.
final class AuthSession {
  const AuthSession({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
    required this.tokenType,
    required this.accessTokenExpiresIn,
    required this.refreshTokenExpiresIn,
  });

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    final user = json['user'];
    final accessToken = json['accessToken'];
    final refreshToken = json['refreshToken'];
    if (user is! Map<String, dynamic> ||
        accessToken is! String ||
        accessToken.isEmpty ||
        refreshToken is! String ||
        refreshToken.isEmpty) {
      throw const FormatException('Malformed authentication session.');
    }
    return AuthSession(
      user: AuthUser.fromJson(user),
      accessToken: accessToken,
      refreshToken: refreshToken,
      tokenType: json['tokenType'] as String? ?? 'Bearer',
      accessTokenExpiresIn: json['accessTokenExpiresIn'] as int? ?? 0,
      refreshTokenExpiresIn: json['refreshTokenExpiresIn'] as int? ?? 0,
    );
  }

  final AuthUser user;
  final String accessToken;
  final String refreshToken;
  final String tokenType;
  final int accessTokenExpiresIn;
  final int refreshTokenExpiresIn;
}

enum AuthStatus { unauthenticated, authenticated }

/// What the UI is allowed to observe. Deliberately token-free.
final class AuthSnapshot {
  const AuthSnapshot({required this.status, this.user});

  static const anonymous = AuthSnapshot(status: AuthStatus.unauthenticated);

  final AuthStatus status;
  final AuthUser? user;

  bool get isAuthenticated => status == AuthStatus.authenticated;
}
