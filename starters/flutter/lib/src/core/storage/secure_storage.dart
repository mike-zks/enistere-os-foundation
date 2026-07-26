const secureStorageContractVersion = 'secure-storage/2.0.0';

abstract interface class SecureStorageAdapter {
  String get contractVersion;
  Future<String?> get(String key);
  Future<void> set(String key, String value);
  Future<void> remove(String key);
}

final class SecureStorage {
  SecureStorage(this._adapter) {
    if (_adapter.contractVersion != secureStorageContractVersion) {
      throw ArgumentError('Unsupported secure-storage contract.');
    }
  }

  final SecureStorageAdapter _adapter;

  Future<String?> get(String key) {
    _assertSafeKey(key);
    return _adapter.get(key);
  }

  Future<void> set(String key, String value) {
    _assertSafeKey(key);
    if (value.isEmpty) {
      throw ArgumentError('Secure-storage values must not be empty.');
    }
    return _adapter.set(key, value);
  }

  Future<void> remove(String key) {
    _assertSafeKey(key);
    return _adapter.remove(key);
  }

  void _assertSafeKey(String key) {
    if (!RegExp(r'^[a-z][a-z0-9._-]{1,127}$').hasMatch(key)) {
      throw ArgumentError(
        'Secure-storage keys must be scoped, stable identifiers.',
      );
    }
  }
}
