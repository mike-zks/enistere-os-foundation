/// Categories understood by the neutral Files contract.
enum FileCategory {
  image('IMAGE'),
  document('DOCUMENT'),
  avatar('AVATAR'),
  media('MEDIA'),
  video('VIDEO'),
  audio('AUDIO'),
  identityDocument('IDENTITY_DOCUMENT'),
  attachment('ATTACHMENT'),
  other('OTHER');

  const FileCategory(this.wireValue);

  final String wireValue;
}

/// Transient description of a file selected by platform-specific UI.
///
/// The capability deliberately accepts a path instead of choosing a picker: the
/// product remains free to use the platform integration that fits it. This value
/// is a command input only and must never enter shared state, logs or telemetry.
final class LocalUploadFile {
  const LocalUploadFile({
    required this.path,
    required this.name,
    required this.mediaType,
  });

  final String path;
  final String name;
  final String mediaType;

  void validate() {
    if (path.trim().isEmpty) {
      throw const FormatException('A local file path is required.');
    }
    if (name.trim().isEmpty || name.contains('/') || name.contains('\\')) {
      throw const FormatException('A plain file name is required.');
    }
    if (!_mediaTypePattern.hasMatch(mediaType)) {
      throw const FormatException('A valid declared media type is required.');
    }
  }

  /// Metadata safe enough for diagnostics: never a device path or raw name.
  SafeFileDescriptor get safeLogDescriptor =>
      SafeFileDescriptor(mediaType: mediaType, extension: _safeExtension(name));
}

final RegExp _mediaTypePattern = RegExp(
  r'^[a-z0-9][a-z0-9!#$&^_.+-]*/[a-z0-9][a-z0-9!#$&^_.+-]*$',
  caseSensitive: false,
);

String? _safeExtension(String name) {
  final dot = name.lastIndexOf('.');
  if (dot < 0 || dot == name.length - 1) return null;
  final extension = name.substring(dot + 1).toLowerCase();
  return RegExp(r'^[a-z0-9]{1,12}$').hasMatch(extension) ? extension : null;
}

final class SafeFileDescriptor {
  const SafeFileDescriptor({required this.mediaType, required this.extension});

  final String mediaType;
  final String? extension;
}
