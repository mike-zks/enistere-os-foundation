import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'secure_storage.dart';

/// The mobile secure store, exposed as a provider so a capability can bind a
/// platform keystore without the baseline depending on one.
///
/// The baseline persists no secret and therefore ships no binding. Reading this
/// provider without a composed binding is a programming error, not a silent
/// fallback: an in-memory default would be strictly worse than none, because a
/// capability could believe it had persisted a credential securely when it had
/// persisted nothing at all.
final secureStorageProvider = Provider<SecureStorage>((ref) {
  throw UnimplementedError(
    'No secure-storage binding is composed. A capability that persists secrets '
    'must override secureStorageProvider with a platform keystore adapter.',
  );
});
