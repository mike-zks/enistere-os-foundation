/// Descriptor for a local file to be uploaded.
///
/// SECURITY (ADR-007/015): [path] is a device path and [name] may carry PII
/// (e.g. "john_passport.jpg"). Never log or store them raw — use
/// [describeFileForLog] for any telemetry.
class AppFile {
  const AppFile({
    required this.path,
    required this.name,
    required this.mimeType,
    this.sizeBytes,
  });

  final String path;
  final String name;
  final String mimeType;
  final int? sizeBytes;
}

/// Safe log/telemetry descriptor — MIME type and sanitised extension only.
/// Never includes [AppFile.path] (device path) or [AppFile.name] (potential PII).
class SafeFileDescriptor {
  const SafeFileDescriptor({required this.mimeType, this.extension});

  final String mimeType;

  /// Lowercased alphanumeric extension (max 12 chars), or null if unsafe / absent.
  final String? extension;
}

/// Returns a [SafeFileDescriptor] safe for logs and telemetry.
/// Drops [AppFile.path] and [AppFile.name] to prevent device-path / PII leaks.
SafeFileDescriptor describeFileForLog(AppFile file) => SafeFileDescriptor(
  mimeType: file.mimeType,
  extension: _safeExtension(file.name),
);

String? _safeExtension(String name) {
  final dot = name.lastIndexOf('.');
  if (dot < 0 || dot >= name.length - 1) return null;
  final ext = name.substring(dot + 1).toLowerCase();
  return RegExp(r'^[a-z0-9]{1,12}$').hasMatch(ext) ? ext : null;
}

/// True only when all [AppFile] fields are structurally present and valid.
/// Does NOT validate file content, size, or backend permissions.
bool isValidAppFile(AppFile file) =>
    file.path.isNotEmpty &&
    file.name.isNotEmpty &&
    file.mimeType.isNotEmpty &&
    file.mimeType.contains('/');

/// UX-only pre-check that the file's MIME type is in [allowedTypes].
/// The backend remains the authority (ADR-007). Empty [allowedTypes] passes all.
/// Supports exact match (`image/jpeg`), group wildcard (`image/*`), or `*/*`.
bool isAllowedUploadContentType(AppFile file, List<String> allowedTypes) {
  if (allowedTypes.isEmpty) return true;
  final group = file.mimeType.split('/').first;
  return allowedTypes.any(
    (a) => a == file.mimeType || a == '$group/*' || a == '*/*',
  );
}
