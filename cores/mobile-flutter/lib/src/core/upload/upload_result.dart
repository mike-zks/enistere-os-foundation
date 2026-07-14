/// Typed result of a successful file upload.
///
/// Contains only public server-assigned metadata.
/// Never includes signed URLs, bucket paths, device paths, or tokens (ADR-015).
class UploadedFileMetadata {
  const UploadedFileMetadata({required this.id, required this.category});

  factory UploadedFileMetadata.fromJson(Map<String, dynamic> json) =>
      UploadedFileMetadata(
        id: json['id'] as String,
        category: json['category'] as String,
      );

  final String id;
  final String category;
}
