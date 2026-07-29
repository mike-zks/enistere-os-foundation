import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/storage/secure_storage.dart';
import '../core/storage/secure_storage_provider.dart';

/// Key of the refresh credential in the platform keystore. Scoped and stable —
/// [SecureStorage] rejects anything else.
const refreshCredentialKey = 'auth.refresh_token';

/// Where the refresh credential lives, as a replaceable seam.
///
/// The interface exists for the same reason Angular's `CredentialStore` and
/// React Native's `SecureStorage` do: the client depends on a contract, never on
/// a platform API. The three runtimes differ by implementation, never by
/// architecture — which is what makes parity measurable instead of declarative.
///
/// Unlike a browser, a phone does offer a protected store. The default
/// implementation therefore *persists*, through the platform keystore: on mobile,
/// "the most protected store the platform actually offers" is a real thing, and
/// keeping the credential in memory would throw away protection the platform
/// grants for free (ADR-076).
abstract interface class CredentialStore {
  /// Returns the stored credential, or `null` when there is none.
  Future<String?> read();

  /// Stores [value], replacing any previous credential.
  Future<void> write(String value);

  /// Removes the credential. A no-op when there is none.
  Future<void> clear();
}

/// Default store: the mobile keystore, reached through the baseline
/// secure-storage contract rather than through a plugin API.
final class SecureCredentialStore implements CredentialStore {
  const SecureCredentialStore(this._storage);

  final SecureStorage _storage;

  @override
  Future<String?> read() => _storage.get(refreshCredentialKey);

  @override
  Future<void> write(String value) => _storage.set(refreshCredentialKey, value);

  @override
  Future<void> clear() => _storage.remove(refreshCredentialKey);
}

/// Volatile store, for tests and for a deployment that deliberately refuses to
/// persist anything. It makes no promise it cannot keep.
final class InMemoryCredentialStore implements CredentialStore {
  String? _value;

  @override
  Future<String?> read() async => _value;

  @override
  Future<void> write(String value) async {
    _value = value;
  }

  @override
  Future<void> clear() async {
    _value = null;
  }
}

final credentialStoreProvider = Provider<CredentialStore>(
  (ref) => SecureCredentialStore(ref.watch(secureStorageProvider)),
);
