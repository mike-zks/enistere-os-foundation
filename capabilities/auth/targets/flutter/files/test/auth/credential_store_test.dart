import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/auth/credential_store.dart';
import 'package:mobile_flutter/src/core/storage/secure_storage.dart';

final class _RecordingAdapter implements SecureStorageAdapter {
  final values = <String, String>{};
  final calls = <String>[];

  @override
  String get contractVersion => secureStorageContractVersion;

  @override
  Future<String?> get(String key) async {
    calls.add('get:$key');
    return values[key];
  }

  @override
  Future<void> set(String key, String value) async {
    calls.add('set:$key');
    values[key] = value;
  }

  @override
  Future<void> remove(String key) async {
    calls.add('remove:$key');
    values.remove(key);
  }
}

void main() {
  test('n’atteint la plateforme qu’à travers la couture de stockage', () async {
    final adapter = _RecordingAdapter();
    final store = SecureCredentialStore(SecureStorage(adapter));

    await store.write('refresh-1');
    expect(await store.read(), 'refresh-1');
    await store.clear();
    expect(await store.read(), isNull);

    // One scoped key, and no other traffic: the capability never reaches a
    // plugin API directly, which is what makes the keystore replaceable.
    expect(adapter.calls, [
      'set:auth.refresh_token',
      'get:auth.refresh_token',
      'remove:auth.refresh_token',
      'get:auth.refresh_token',
    ]);
    expect(adapter.values, isEmpty);
  });

  test('le magasin volatil ne promet rien qu’il ne tienne', () async {
    final store = InMemoryCredentialStore();

    await store.write('refresh-1');
    expect(await store.read(), 'refresh-1');

    // A fresh instance is a fresh process: nothing survives it, by design.
    expect(await InMemoryCredentialStore().read(), isNull);
  });
}
