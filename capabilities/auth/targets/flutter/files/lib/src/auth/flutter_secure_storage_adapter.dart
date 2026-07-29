import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../core/storage/secure_storage.dart';

/// Binds the baseline secure-storage contract to the platform keystore.
///
/// This is the only file in the capability that knows a plugin exists. Every
/// other file depends on [SecureStorageAdapter], which is why swapping the
/// keystore — or stubbing it in a test — never touches authentication logic.
///
/// The options are not defaults: on Android, `encryptedSharedPreferences` moves
/// the credential out of a plain preferences file; on iOS, tying it to
/// `first_unlock_this_device` keeps it off iCloud backups, so a restored device
/// never resurrects someone else's refresh session.
final class FlutterSecureStorageAdapter implements SecureStorageAdapter {
  const FlutterSecureStorageAdapter({FlutterSecureStorage? storage})
    : _storage = storage ?? _platformKeystore;

  static const _platformKeystore = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  final FlutterSecureStorage _storage;

  @override
  String get contractVersion => secureStorageContractVersion;

  @override
  Future<String?> get(String key) => _storage.read(key: key);

  @override
  Future<void> set(String key, String value) =>
      _storage.write(key: key, value: value);

  @override
  Future<void> remove(String key) => _storage.delete(key: key);
}
