import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'session_envelope.dart';
import 'session_store.dart';

// Seam allowing unit tests to inject a fake adapter without platform channels.
abstract interface class SecureStorageAdapter {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
  Future<void> delete(String key);
}

// Production adapter backed by flutter_secure_storage
// (Keychain on iOS, EncryptedSharedPreferences / Keystore on Android).
class FlutterSecureStorageAdapter implements SecureStorageAdapter {
  FlutterSecureStorageAdapter() : _storage = const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  @override
  Future<String?> read(String key) => _storage.read(key: key);

  @override
  Future<void> write(String key, String value) =>
      _storage.write(key: key, value: value);

  @override
  Future<void> delete(String key) => _storage.delete(key: key);
}

// Persistent SessionStore backed by flutter_secure_storage.
// Access token is NEVER stored here — it stays in AuthController._accessToken (memory-only).
// Stored payload: SessionEnvelope JSON (userId + optional refreshToken).
class SecureSessionStore implements SessionStore {
  SecureSessionStore(this._adapter);

  final SecureStorageAdapter _adapter;

  // Fixed storage key — no token content in key.
  static const _kKey = 'session';

  @override
  Future<SessionEnvelope?> read() async {
    try {
      final raw = await _adapter.read(_kKey);
      if (raw == null) return null;
      final map = jsonDecode(raw) as Map<String, dynamic>;
      return SessionEnvelope.fromJson(map);
    } catch (_) {
      // Purge corrupt / unreadable data. Fail-soft → caller gets null → unauthenticated.
      await _adapter.delete(_kKey);
      return null;
    }
  }

  @override
  Future<void> write(SessionEnvelope envelope) async {
    await _adapter.write(_kKey, jsonEncode(envelope.toJson()));
  }

  @override
  Future<void> clear() => _adapter.delete(_kKey);
}
