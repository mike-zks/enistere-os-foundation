import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/dio_provider.dart';
import 'upload_file.dart';

/// Public metadata returned by the Files authority. Storage coordinates are not
/// representable here.
final class PublicStoredFile {
  const PublicStoredFile({
    required this.id,
    required this.originalName,
    required this.mediaType,
    required this.size,
    required this.category,
    required this.createdAt,
    this.status,
  });

  factory PublicStoredFile.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    final originalName = json['originalName'];
    final mediaType = json['mimeType'];
    final size = json['size'];
    final category = json['category'];
    final createdAt = json['createdAt'];
    if (id is! String ||
        originalName is! String ||
        mediaType is! String ||
        size is! int ||
        category is! String ||
        createdAt is! String) {
      throw const FormatException('Malformed public file metadata.');
    }
    return PublicStoredFile(
      id: id,
      originalName: originalName,
      mediaType: mediaType,
      size: size,
      category: category,
      createdAt: createdAt,
      status: json['status'] as String?,
    );
  }

  final String id;
  final String originalName;
  final String mediaType;
  final int size;
  final String category;
  final String createdAt;
  final String? status;
}

/// Stateless upload transport. The selected file stays a method argument: it is
/// neither cached nor exposed through Riverpod state.
final class FilesApi {
  const FilesApi(this._transport);

  final Dio _transport;

  Future<PublicStoredFile> upload({
    required LocalUploadFile file,
    required FileCategory category,
    String? subjectId,
  }) async {
    file.validate();
    if (subjectId != null &&
        (subjectId.trim().isEmpty || subjectId.length > 128)) {
      throw const FormatException('Invalid file subject identifier.');
    }

    final multipart = await MultipartFile.fromFile(
      file.path,
      filename: file.name,
      contentType: DioMediaType.parse(file.mediaType),
    );
    final response = await _transport.post<Map<String, dynamic>>(
      '/api/v1/files/upload',
      data: FormData.fromMap({
        'file': multipart,
        'category': category.wireValue,
        'subjectId': ?subjectId,
      }),
    );
    return PublicStoredFile.fromJson(
      response.data ?? const <String, dynamic>{},
    );
  }
}

/// Uses the baseline Dio client, where Authentication contributes the bearer
/// interceptor. Files never reads or stores a credential itself.
final filesApiProvider = Provider<FilesApi>(
  (ref) => FilesApi(ref.watch(dioClientProvider)),
);
