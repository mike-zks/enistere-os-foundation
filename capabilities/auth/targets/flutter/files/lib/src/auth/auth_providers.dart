// `Override` lives in misc.dart since Riverpod 3: the main entry point does not
// export it.
import 'package:flutter_riverpod/misc.dart';

import '../core/storage/secure_storage.dart';
import '../core/storage/secure_storage_provider.dart';
import 'flutter_secure_storage_adapter.dart';

/// Binds the baseline secure-storage seam to the platform keystore.
///
/// Composed through `flutter.provider-override`. The baseline declares the
/// contract and ships no binding; the capability that actually persists a secret
/// is the one that brings the platform dependency — the same division React
/// Native follows with `expo-secure-store`.
final Override authSecureStorageOverride = secureStorageProvider.overrideWith(
  (ref) => SecureStorage(const FlutterSecureStorageAdapter()),
);
