import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/core/auth/session_envelope.dart';
import 'package:mobile_flutter/src/core/auth/session_store.dart';

void main() {
  group('InMemorySessionStore', () {
    late InMemorySessionStore store;

    setUp(() => store = InMemorySessionStore());

    test('read returns null when empty', () async {
      expect(await store.read(), isNull);
    });

    test('write then read returns envelope', () async {
      const env = SessionEnvelope(userId: 'user-1');
      await store.write(env);
      expect(await store.read(), equals(env));
    });

    test('clear removes stored envelope', () async {
      await store.write(const SessionEnvelope(userId: 'user-1'));
      await store.clear();
      expect(await store.read(), isNull);
    });

    test('write overwrites previous value', () async {
      await store.write(const SessionEnvelope(userId: 'user-1'));
      await store.write(const SessionEnvelope(userId: 'user-2'));
      expect((await store.read())?.userId, equals('user-2'));
    });
  });
}
