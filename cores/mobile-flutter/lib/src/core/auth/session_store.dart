import 'session_envelope.dart';

// Seam: derived projects wire flutter_secure_storage (or Hive) as the real adapter.
abstract interface class SessionStore {
  Future<SessionEnvelope?> read();
  Future<void> write(SessionEnvelope envelope);
  Future<void> clear();
}

// Placeholder: in-memory only. Survives the process lifetime, not device restarts.
// ADR-015: no token ever stored in persistent storage at this layer.
class InMemorySessionStore implements SessionStore {
  SessionEnvelope? _envelope;

  @override
  Future<SessionEnvelope?> read() async => _envelope;

  @override
  Future<void> write(SessionEnvelope envelope) async => _envelope = envelope;

  @override
  Future<void> clear() async => _envelope = null;
}
