/// Upload file categories aligned with `@enistere/api-contracts`.
enum FileCategory {
  image,
  document,
  avatar,
  media,
  video,
  audio,
  identityDocument,
  attachment,
  other,
}

extension FileCategoryExtension on FileCategory {
  String get apiValue => switch (this) {
    FileCategory.image => 'IMAGE',
    FileCategory.document => 'DOCUMENT',
    FileCategory.avatar => 'AVATAR',
    FileCategory.media => 'MEDIA',
    FileCategory.video => 'VIDEO',
    FileCategory.audio => 'AUDIO',
    FileCategory.identityDocument => 'IDENTITY_DOCUMENT',
    FileCategory.attachment => 'ATTACHMENT',
    FileCategory.other => 'OTHER',
  };
}
