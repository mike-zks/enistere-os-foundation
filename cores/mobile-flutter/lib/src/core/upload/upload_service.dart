import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';

import '../api/app_api_error.dart';
import '../api/error_interceptor.dart';
import 'app_file.dart';
import 'file_category.dart';
import 'upload_result.dart';

/// Injectable factory for [MultipartFile]. Allows test isolation without a
/// real file system (tests supply [MultipartFile.fromBytes] instead).
typedef MultipartFileFactory = Future<MultipartFile> Function(AppFile file);

abstract interface class UploadService {
  Future<UploadedFileMetadata> upload(
    AppFile file,
    FileCategory category, {
    String? subjectId,
  });
}

class DioUploadService implements UploadService {
  DioUploadService({
    required this.dio,
    this.uploadPath = '/files',
    MultipartFileFactory? multipartFileFactory,
  }) : _multipartFileFactory = multipartFileFactory ?? _defaultFactory;

  final Dio dio;
  final String uploadPath;
  final MultipartFileFactory _multipartFileFactory;

  static Future<MultipartFile> _defaultFactory(AppFile file) =>
      MultipartFile.fromFile(
        file.path,
        filename: file.name,
        contentType: MediaType.parse(file.mimeType),
      );

  @override
  Future<UploadedFileMetadata> upload(
    AppFile file,
    FileCategory category, {
    String? subjectId,
  }) async {
    // FormData is built fresh each call — a MultipartFile stream cannot be
    // replayed after the first POST. Dio sets Content-Type automatically with
    // a unique boundary; NEVER set Content-Type: multipart/form-data manually.
    final part = await _multipartFileFactory(file);
    final formData = FormData.fromMap({
      'file': part,
      'category': category.apiValue,
      'subjectId': ?subjectId,
    });

    try {
      final response = await dio.post<Map<String, dynamic>>(
        uploadPath,
        data: formData,
      );
      return UploadedFileMetadata.fromJson(response.data!);
    } on DioException catch (e) {
      // ErrorInterceptor wraps the error; unwrap if already typed.
      if (e.error is AppApiError) throw e.error as AppApiError;
      throw mapDioError(e);
    }
  }
}
