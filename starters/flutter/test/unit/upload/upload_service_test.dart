import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/core/api/app_api_error.dart';
import 'package:mobile_flutter/src/core/api/dio_client.dart';
import 'package:mobile_flutter/src/core/config/api_config.dart';
import 'package:mobile_flutter/src/core/upload/app_file.dart';
import 'package:mobile_flutter/src/core/upload/file_category.dart';
import 'package:mobile_flutter/src/core/upload/upload_result.dart';
import 'package:mobile_flutter/src/core/upload/upload_service.dart';

const _testConfig = ApiConfig(baseUrl: 'http://test.local');

const _testFile = AppFile(
  path: '/tmp/photo.jpg',
  name: 'photo.jpg',
  mimeType: 'image/jpeg',
  sizeBytes: 1024,
);

/// Bytes-based factory — no filesystem access in tests.
Future<MultipartFile> _bytesFactory(AppFile file) async =>
    MultipartFile.fromBytes([0xFF, 0xD8, 0xFF], filename: file.name);

class _CaptureAdapter implements HttpClientAdapter {
  _CaptureAdapter({required this.onFetch});

  final Future<ResponseBody> Function(RequestOptions options) onFetch;
  RequestOptions? lastOptions;
  String? capturedContentType;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) {
    lastOptions = options;
    capturedContentType =
        options.headers['content-type']?.toString() ??
        options.headers['Content-Type']?.toString();
    return onFetch(options);
  }

  @override
  void close({bool force = false}) {}
}

ResponseBody _successBody() {
  final bytes = utf8.encode('{"id":"abc123","category":"IMAGE"}');
  return ResponseBody.fromBytes(
    bytes,
    200,
    headers: {
      Headers.contentTypeHeader: ['application/json'],
    },
  );
}

ResponseBody _errorBody(int statusCode) {
  return ResponseBody.fromBytes(
    utf8.encode('{}'),
    statusCode,
    headers: {
      Headers.contentTypeHeader: ['application/json'],
    },
  );
}

void main() {
  group('DioUploadService', () {
    test('implements UploadService', () {
      final svc = DioUploadService(
        dio: Dio(),
        multipartFileFactory: _bytesFactory,
      );
      expect(svc, isA<UploadService>());
    });

    test('uploadPath defaults to /files', () {
      final svc = DioUploadService(
        dio: Dio(),
        multipartFileFactory: _bytesFactory,
      );
      expect(svc.uploadPath, '/files');
    });

    test('POST is sent to uploadPath', () async {
      final adapter = _CaptureAdapter(
        onFetch: (opts) async {
          expect(opts.path, '/files');
          return _successBody();
        },
      );
      final dio = createDioClient(config: _testConfig, tokenReader: () => null)
        ..httpClientAdapter = adapter;

      await DioUploadService(
        dio: dio,
        multipartFileFactory: _bytesFactory,
      ).upload(_testFile, FileCategory.image);
    });

    test(
      'Dio sets Content-Type with boundary automatically (never forced)',
      () async {
        late String? captured;
        final adapter = _CaptureAdapter(
          onFetch: (opts) async {
            captured =
                opts.headers['content-type']?.toString() ??
                opts.headers['Content-Type']?.toString();
            return _successBody();
          },
        );
        final dio = createDioClient(
          config: _testConfig,
          tokenReader: () => null,
        )..httpClientAdapter = adapter;

        await DioUploadService(
          dio: dio,
          multipartFileFactory: _bytesFactory,
        ).upload(_testFile, FileCategory.image);

        // Dio must add boundary; content-type must NOT be just 'multipart/form-data'
        expect(captured, contains('multipart/form-data'));
        expect(captured, contains('boundary='));
      },
    );

    test('category is sent as API string value', () async {
      String? capturedCategory;
      final adapter = _CaptureAdapter(
        onFetch: (opts) async {
          final data = opts.data as FormData;
          capturedCategory = data.fields
              .firstWhere((f) => f.key == 'category')
              .value;
          return _successBody();
        },
      );
      final dio = createDioClient(config: _testConfig, tokenReader: () => null)
        ..httpClientAdapter = adapter;

      await DioUploadService(
        dio: dio,
        multipartFileFactory: _bytesFactory,
      ).upload(_testFile, FileCategory.image);

      expect(capturedCategory, 'IMAGE');
    });

    test('subjectId is included in form when provided', () async {
      String? capturedSubjectId;
      final adapter = _CaptureAdapter(
        onFetch: (opts) async {
          final data = opts.data as FormData;
          final match = data.fields.where((f) => f.key == 'subjectId');
          capturedSubjectId = match.isNotEmpty ? match.first.value : null;
          return _successBody();
        },
      );
      final dio = createDioClient(config: _testConfig, tokenReader: () => null)
        ..httpClientAdapter = adapter;

      await DioUploadService(
        dio: dio,
        multipartFileFactory: _bytesFactory,
      ).upload(_testFile, FileCategory.avatar, subjectId: 'user-99');

      expect(capturedSubjectId, 'user-99');
    });

    test('subjectId is omitted when not provided', () async {
      bool hasSubjectId = true;
      final adapter = _CaptureAdapter(
        onFetch: (opts) async {
          final data = opts.data as FormData;
          hasSubjectId = data.fields.any((f) => f.key == 'subjectId');
          return _successBody();
        },
      );
      final dio = createDioClient(config: _testConfig, tokenReader: () => null)
        ..httpClientAdapter = adapter;

      await DioUploadService(
        dio: dio,
        multipartFileFactory: _bytesFactory,
      ).upload(_testFile, FileCategory.document);

      expect(hasSubjectId, isFalse);
    });

    test('returns UploadedFileMetadata on success', () async {
      final adapter = _CaptureAdapter(onFetch: (_) async => _successBody());
      final dio = createDioClient(config: _testConfig, tokenReader: () => null)
        ..httpClientAdapter = adapter;

      final result = await DioUploadService(
        dio: dio,
        multipartFileFactory: _bytesFactory,
      ).upload(_testFile, FileCategory.image);

      expect(result, isA<UploadedFileMetadata>());
      expect(result.id, 'abc123');
      expect(result.category, 'IMAGE');
    });

    test('413 response throws TooLargeError', () async {
      final adapter = _CaptureAdapter(onFetch: (_) async => _errorBody(413));
      final dio = createDioClient(config: _testConfig, tokenReader: () => null)
        ..httpClientAdapter = adapter;

      await expectLater(
        DioUploadService(
          dio: dio,
          multipartFileFactory: _bytesFactory,
        ).upload(_testFile, FileCategory.image),
        throwsA(isA<TooLargeError>()),
      );
    });

    test('415 response throws UnsupportedTypeError', () async {
      final adapter = _CaptureAdapter(onFetch: (_) async => _errorBody(415));
      final dio = createDioClient(config: _testConfig, tokenReader: () => null)
        ..httpClientAdapter = adapter;

      await expectLater(
        DioUploadService(
          dio: dio,
          multipartFileFactory: _bytesFactory,
        ).upload(_testFile, FileCategory.image),
        throwsA(isA<UnsupportedTypeError>()),
      );
    });

    test('401 response throws UnauthorizedError', () async {
      final adapter = _CaptureAdapter(onFetch: (_) async => _errorBody(401));
      final dio = createDioClient(config: _testConfig, tokenReader: () => null)
        ..httpClientAdapter = adapter;

      await expectLater(
        DioUploadService(
          dio: dio,
          multipartFileFactory: _bytesFactory,
        ).upload(_testFile, FileCategory.image),
        throwsA(isA<UnauthorizedError>()),
      );
    });

    test('connection error throws NetworkError', () async {
      final adapter = _CaptureAdapter(
        onFetch: (_) async => throw DioException(
          requestOptions: RequestOptions(path: '/files'),
          type: DioExceptionType.connectionError,
        ),
      );
      final dio = createDioClient(config: _testConfig, tokenReader: () => null)
        ..httpClientAdapter = adapter;

      await expectLater(
        DioUploadService(
          dio: dio,
          multipartFileFactory: _bytesFactory,
        ).upload(_testFile, FileCategory.image),
        throwsA(isA<NetworkError>()),
      );
    });

    test('token never appears in logged request path', () async {
      final logLines = <String>[];
      final adapter = _CaptureAdapter(onFetch: (_) async => _successBody());
      final dio = createDioClient(
        config: _testConfig,
        tokenReader: () => 'super-secret-token',
        logger: logLines.add,
      )..httpClientAdapter = adapter;

      await DioUploadService(
        dio: dio,
        multipartFileFactory: _bytesFactory,
      ).upload(_testFile, FileCategory.image);

      for (final line in logLines) {
        expect(line, isNot(contains('super-secret-token')));
      }
    });

    test('file path never appears in logged output', () async {
      final logLines = <String>[];
      final adapter = _CaptureAdapter(onFetch: (_) async => _successBody());
      final dio = createDioClient(
        config: _testConfig,
        tokenReader: () => null,
        logger: logLines.add,
      )..httpClientAdapter = adapter;

      await DioUploadService(
        dio: dio,
        multipartFileFactory: _bytesFactory,
      ).upload(_testFile, FileCategory.image);

      for (final line in logLines) {
        expect(line, isNot(contains('/tmp/photo.jpg')));
      }
    });
  });
}
