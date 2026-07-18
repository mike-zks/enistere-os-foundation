// Stored session data — never contains access token (access token is memory-only, ADR-015).
class SessionEnvelope {
  const SessionEnvelope({required this.userId, this.refreshToken});

  factory SessionEnvelope.fromJson(Map<String, dynamic> json) {
    final userId = json['userId'] as String?;
    if (userId == null || userId.isEmpty) {
      throw const FormatException('SessionEnvelope: missing or empty userId');
    }
    return SessionEnvelope(
      userId: userId,
      refreshToken: json['refreshToken'] as String?,
    );
  }

  final String userId;

  // Refresh token stored in flutter_secure_storage (Keychain/Keystore).
  // Never logged, never in AuthState, never in any non-secure persistent store.
  // Populated by POST /auth/login — placeholder until B3 (RefreshInterceptor).
  final String? refreshToken;

  Map<String, dynamic> toJson() => {
    'userId': userId,
    if (refreshToken != null) 'refreshToken': refreshToken,
  };

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SessionEnvelope &&
          runtimeType == other.runtimeType &&
          userId == other.userId &&
          refreshToken == other.refreshToken;

  @override
  int get hashCode => Object.hash(userId, refreshToken);

  // refreshToken intentionally omitted to prevent accidental logging.
  @override
  String toString() => 'SessionEnvelope(userId: $userId)';
}
