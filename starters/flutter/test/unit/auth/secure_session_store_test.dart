import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/core/auth/secure_session_store.dart';
import 'package:mobile_flutter/src/core/auth/session_envelope.dart';

// In-memory fake — avoids platform channel requirement in unit tests.
class FakeSecureStorageAdapter implements SecureStorageAdapter {
  final _store = <String, String>{};

  @override
  Future<String?> read(String key) async => _store[key];

  @override
  Future<void> write(String key, String value) async => _store[key] = value;

  @override
  Future<void> delete(String key) async => _store.remove(key);
}

void main() {
  late FakeSecureStorageAdapter adapter;
  late SecureSessionStore store;

  setUp(() {
    adapter = FakeSecureStorageAdapter();
    store = SecureSessionStore(adapter);
  });

  group('SecureSessionStore — read/write/clear', () {
    test('read returns null when storage is empty', () async {
      expect(await store.read(), isNull);
    });

    test('write then read returns envelope with userId', () async {
      const env = SessionEnvelope(userId: 'user-1');
      await store.write(env);
      final result = await store.read();
      expect(result?.userId, 'user-1');
    });

    test('write then read preserves refreshToken', () async {
      const env = SessionEnvelope(userId: 'u1', refreshToken: 'tok-xyz');
      await store.write(env);
      final result = await store.read();
      expect(result?.refreshToken, 'tok-xyz');
    });

    test('clear removes stored envelope', () async {
      await store.write(const SessionEnvelope(userId: 'user-1'));
      await store.clear();
      expect(await store.read(), isNull);
    });

    test('write overwrites previous envelope', () async {
      await store.write(const SessionEnvelope(userId: 'user-1'));
      await store.write(const SessionEnvelope(userId: 'user-2'));
      final result = await store.read();
      expect(result?.userId, 'user-2');
    });

    test('envelope without refreshToken round-trips correctly', () async {
      const env = SessionEnvelope(userId: 'u-no-refresh');
      await store.write(env);
      final result = await store.read();
      expect(result?.userId, 'u-no-refresh');
      expect(result?.refreshToken, isNull);
    });
  });

  group('SecureSessionStore — defensive validation (corrupt data)', () {
    test('invalid JSON is purged and returns null', () async {
      await adapter.write('session', 'not-json{{{');
      expect(await store.read(), isNull);
      expect(await adapter.read('session'), isNull);
    });

    test('missing userId is purged and returns null', () async {
      await adapter.write('session', jsonEncode({'refreshToken': 'tok'}));
      expect(await store.read(), isNull);
      expect(await adapter.read('session'), isNull);
    });

    test('empty userId is purged and returns null', () async {
      await adapter.write(
        'session',
        jsonEncode({'userId': '', 'refreshToken': 'tok'}),
      );
      expect(await store.read(), isNull);
      expect(await adapter.read('session'), isNull);
    });

    test('null userId is purged and returns null', () async {
      await adapter.write('session', jsonEncode({'userId': null}));
      expect(await store.read(), isNull);
      expect(await adapter.read('session'), isNull);
    });

    test('empty JSON object is purged and returns null', () async {
      await adapter.write('session', jsonEncode({}));
      expect(await store.read(), isNull);
      expect(await adapter.read('session'), isNull);
    });
  });

  group('SecureSessionStore — access token guarantee', () {
    test('stored JSON never contains access token field', () async {
      const env = SessionEnvelope(userId: 'u1', refreshToken: 'ref-tok');
      await store.write(env);
      final raw = await adapter.read('session');
      expect(raw, isNotNull);
      expect(raw, isNot(contains('accessToken')));
      expect(raw, isNot(contains('_accessToken')));
      expect(raw, isNot(contains('access_token')));
    });

    test('SessionEnvelope toJson keys never include access token', () {
      const env = SessionEnvelope(userId: 'u1', refreshToken: 'ref-tok');
      final keys = env.toJson().keys;
      for (final key in keys) {
        expect(key.toLowerCase(), isNot(contains('access')));
      }
    });

    test('SessionEnvelope toString omits refreshToken', () {
      const env = SessionEnvelope(userId: 'u1', refreshToken: 'secret-refresh');
      final s = env.toString();
      expect(s, isNot(contains('secret-refresh')));
      expect(s, isNot(contains('refresh')));
    });

    test('write returns void — no token leaks through return value', () async {
      // write() is Future<void> — the token cannot leak through its return type.
      // This test documents the contract: calling write() completes normally.
      const env = SessionEnvelope(userId: 'u1', refreshToken: 'sensitive');
      await expectLater(store.write(env), completes);
    });
  });

  group('SecureSessionStore — signOut clears stored data', () {
    test('clear after write removes all data', () async {
      await store.write(
        const SessionEnvelope(userId: 'u1', refreshToken: 'tok'),
      );
      await store.clear();
      expect(await store.read(), isNull);
      expect(await adapter.read('session'), isNull);
    });

    test('multiple clear calls are idempotent', () async {
      await store.clear();
      await store.clear();
      expect(await store.read(), isNull);
    });
  });

  group('SessionEnvelope serialization', () {
    test('fromJson round-trips with userId only', () {
      final env = SessionEnvelope.fromJson({'userId': 'u1'});
      expect(env.userId, 'u1');
      expect(env.refreshToken, isNull);
    });

    test('fromJson round-trips with userId + refreshToken', () {
      final env = SessionEnvelope.fromJson({
        'userId': 'u1',
        'refreshToken': 'tok',
      });
      expect(env.userId, 'u1');
      expect(env.refreshToken, 'tok');
    });

    test('toJson with refreshToken includes both fields', () {
      const env = SessionEnvelope(userId: 'u1', refreshToken: 'tok');
      final json = env.toJson();
      expect(json['userId'], 'u1');
      expect(json['refreshToken'], 'tok');
    });

    test('toJson without refreshToken omits refreshToken key', () {
      const env = SessionEnvelope(userId: 'u1');
      final json = env.toJson();
      expect(json['userId'], 'u1');
      expect(json.containsKey('refreshToken'), isFalse);
    });

    test('fromJson throws on missing userId', () {
      expect(
        () => SessionEnvelope.fromJson({'refreshToken': 'tok'}),
        throwsA(isA<FormatException>()),
      );
    });

    test('fromJson throws on empty userId', () {
      expect(
        () => SessionEnvelope.fromJson({'userId': ''}),
        throwsA(isA<FormatException>()),
      );
    });

    test('equality compares userId and refreshToken', () {
      const a = SessionEnvelope(userId: 'u1', refreshToken: 'tok');
      const b = SessionEnvelope(userId: 'u1', refreshToken: 'tok');
      const c = SessionEnvelope(userId: 'u1');
      expect(a, equals(b));
      expect(a, isNot(equals(c)));
    });
  });
}
