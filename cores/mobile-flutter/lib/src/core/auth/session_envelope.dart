// Stored session data — never contains access token (access token is memory-only).
class SessionEnvelope {
  const SessionEnvelope({required this.userId});

  final String userId;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SessionEnvelope &&
          runtimeType == other.runtimeType &&
          userId == other.userId;

  @override
  int get hashCode => userId.hashCode;

  @override
  String toString() => 'SessionEnvelope(userId: $userId)';
}
