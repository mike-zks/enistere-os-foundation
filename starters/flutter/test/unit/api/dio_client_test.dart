import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/core/api/app_api_error.dart';
import 'package:mobile_flutter/src/core/api/dio_client.dart';
import 'package:mobile_flutter/src/core/config/api_config.dart';

const _testConfig = ApiConfig(
  baseUrl: 'http://test.local',
  connectTimeoutMs: 5000,
  receiveTimeoutMs: 15000,
  sendTimeoutMs: 15000,
);

class _CaptureAdapter implements HttpClientAdapter {
  _CaptureAdapter({required this.onFetch});
  final Future<ResponseBody> Function(RequestOptions options) onFetch;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) => onFetch(options);

  @override
  void close({bool force = false}) {}
}

void main() {
  group('createDioClient — configuration', () {
    test('applies baseUrl from ApiConfig', () {
      final dio = createDioClient(config: _testConfig, tokenReader: () => null);
      expect(dio.options.baseUrl, 'http://test.local');
    });

    test('applies connectTimeout from ApiConfig', () {
      final dio = createDioClient(config: _testConfig, tokenReader: () => null);
      expect(dio.options.connectTimeout, const Duration(milliseconds: 5000));
    });

    test('applies receiveTimeout from ApiConfig', () {
      final dio = createDioClient(config: _testConfig, tokenReader: () => null);
      expect(dio.options.receiveTimeout, const Duration(milliseconds: 15000));
    });

    test('applies sendTimeout from ApiConfig', () {
      final dio = createDioClient(config: _testConfig, tokenReader: () => null);
      expect(dio.options.sendTimeout, const Duration(milliseconds: 15000));
    });
  });

  group('createDioClient — token injection', () {
    test('injects Authorization header when token is present', () async {
      String? capturedAuth;
      final dio = createDioClient(
        config: _testConfig,
        tokenReader: () => 'access-token-xyz',
      );
      dio.httpClientAdapter = _CaptureAdapter(
        onFetch: (options) async {
          capturedAuth = options.headers['Authorization'] as String?;
          return ResponseBody.fromString('{}', 200);
        },
      );

      await dio.get('/probe');
      expect(capturedAuth, equals('Bearer access-token-xyz'));
    });

    test('omits Authorization header when tokenReader returns null', () async {
      Object? capturedAuth;
      final dio = createDioClient(config: _testConfig, tokenReader: () => null);
      dio.httpClientAdapter = _CaptureAdapter(
        onFetch: (options) async {
          capturedAuth = options.headers['Authorization'];
          return ResponseBody.fromString('{}', 200);
        },
      );

      await dio.get('/probe');
      expect(capturedAuth, isNull);
    });

    test('token is read dynamically per request', () async {
      String? currentToken = 'first-token';
      final captured = <String?>[];
      final dio = createDioClient(
        config: _testConfig,
        tokenReader: () => currentToken,
      );
      dio.httpClientAdapter = _CaptureAdapter(
        onFetch: (options) async {
          captured.add(options.headers['Authorization'] as String?);
          return ResponseBody.fromString('{}', 200);
        },
      );

      await dio.get('/r1');
      currentToken = 'second-token';
      await dio.get('/r2');

      expect(captured[0], 'Bearer first-token');
      expect(captured[1], 'Bearer second-token');
    });

    test('token value never appears in logs', () async {
      final logs = <String>[];
      final dio = createDioClient(
        config: _testConfig,
        tokenReader: () => 'very-secret-token',
        logger: logs.add,
      );
      dio.httpClientAdapter = _CaptureAdapter(
        onFetch: (_) async => ResponseBody.fromString('{}', 200),
      );

      await dio.get('/sensitive');

      for (final entry in logs) {
        expect(entry, isNot(contains('very-secret-token')));
      }
    });
  });

  group('createDioClient — correlationId', () {
    test('injects X-Request-Id when correlationIdReader provided', () async {
      String? capturedId;
      final dio = createDioClient(
        config: _testConfig,
        tokenReader: () => null,
        correlationIdReader: () => 'req-abc-123',
      );
      dio.httpClientAdapter = _CaptureAdapter(
        onFetch: (options) async {
          capturedId = options.headers['X-Request-Id'] as String?;
          return ResponseBody.fromString('{}', 200);
        },
      );

      await dio.get('/probe');
      expect(capturedId, equals('req-abc-123'));
    });

    test('omits X-Request-Id when correlationIdReader returns null', () async {
      Object? capturedId;
      final dio = createDioClient(
        config: _testConfig,
        tokenReader: () => null,
        correlationIdReader: () => null,
      );
      dio.httpClientAdapter = _CaptureAdapter(
        onFetch: (options) async {
          capturedId = options.headers['X-Request-Id'];
          return ResponseBody.fromString('{}', 200);
        },
      );

      await dio.get('/probe');
      expect(capturedId, isNull);
    });
  });

  group('createDioClient — 401 surfaced without refresh', () {
    test('401 becomes UnauthorizedError without retry', () async {
      int requestCount = 0;
      final dio = createDioClient(
        config: _testConfig,
        tokenReader: () => 'token',
      );
      dio.httpClientAdapter = _CaptureAdapter(
        onFetch: (options) async {
          requestCount++;
          throw DioException(
            requestOptions: options,
            response: Response(requestOptions: options, statusCode: 401),
            type: DioExceptionType.badResponse,
          );
        },
      );

      try {
        await dio.get('/protected');
        fail('Expected DioException');
      } on DioException catch (e) {
        expect(e.error, isA<UnauthorizedError>());
        expect(requestCount, equals(1), reason: 'no retry on 401');
      }
    });
  });
}
