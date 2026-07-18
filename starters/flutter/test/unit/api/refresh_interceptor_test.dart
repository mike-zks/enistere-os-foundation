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

DioException _make401(RequestOptions opts) => DioException(
  requestOptions: opts,
  response: Response(requestOptions: opts, statusCode: 401),
  type: DioExceptionType.badResponse,
);

DioException _make403(RequestOptions opts) => DioException(
  requestOptions: opts,
  response: Response(requestOptions: opts, statusCode: 403),
  type: DioExceptionType.badResponse,
);

void main() {
  group('RefreshInterceptor — success path', () {
    test('401 triggers refresh and retries once, returning 200', () async {
      var callCount = 0;
      var refreshCount = 0;
      var currentToken = 'old-token';

      final dio = createDioClient(
        config: _testConfig,
        tokenReader: () => currentToken,
        refresher: () async {
          refreshCount++;
          currentToken = 'new-token';
          return 'new-token';
        },
      );
      dio.httpClientAdapter = _CaptureAdapter(
        onFetch: (opts) async {
          callCount++;
          if (opts.extra['_refreshed'] != true) {
            throw _make401(opts);
          }
          return ResponseBody.fromString('{"ok": true}', 200);
        },
      );

      final response = await dio.get<dynamic>('/protected');
      expect(response.statusCode, 200);
      expect(callCount, 2, reason: 'original request + one retry');
      expect(refreshCount, 1, reason: 'refresh called exactly once');
    });

    test('retry request carries the fresh Authorization header', () async {
      String? retryAuthHeader;
      var currentToken = 'stale-token';

      final dio = createDioClient(
        config: _testConfig,
        tokenReader: () => currentToken,
        refresher: () async {
          currentToken = 'fresh-token';
          return 'fresh-token';
        },
      );
      dio.httpClientAdapter = _CaptureAdapter(
        onFetch: (opts) async {
          if (opts.extra['_refreshed'] != true) {
            throw _make401(opts);
          }
          retryAuthHeader = opts.headers['Authorization'] as String?;
          return ResponseBody.fromString('{}', 200);
        },
      );

      await dio.get<dynamic>('/protected');
      expect(retryAuthHeader, 'Bearer fresh-token');
    });
  });

  group('RefreshInterceptor — loop prevention', () {
    test(
      'retry that returns 401 surfaces UnauthorizedError without looping',
      () async {
        var callCount = 0;
        var refreshCount = 0;

        final dio = createDioClient(
          config: _testConfig,
          tokenReader: () => 'token',
          refresher: () async {
            refreshCount++;
            return 'new-token';
          },
        );
        dio.httpClientAdapter = _CaptureAdapter(
          onFetch: (opts) async {
            callCount++;
            throw _make401(opts);
          },
        );

        try {
          await dio.get<dynamic>('/protected');
          fail('Expected DioException');
        } on DioException catch (e) {
          expect(e.error, isA<UnauthorizedError>());
          expect(
            callCount,
            2,
            reason: 'original + one retry, no further looping',
          );
          expect(
            refreshCount,
            1,
            reason: 'refresh called once, never on retry-401',
          );
        }
      },
    );
  });

  group('RefreshInterceptor — refresh failure', () {
    test(
      'refresher returns null — 401 surfaced as UnauthorizedError',
      () async {
        var callCount = 0;

        final dio = createDioClient(
          config: _testConfig,
          tokenReader: () => 'token',
          refresher: () async => null,
        );
        dio.httpClientAdapter = _CaptureAdapter(
          onFetch: (opts) async {
            callCount++;
            throw _make401(opts);
          },
        );

        try {
          await dio.get<dynamic>('/protected');
          fail('Expected DioException');
        } on DioException catch (e) {
          expect(e.error, isA<UnauthorizedError>());
          expect(callCount, 1, reason: 'no retry when refresh returns null');
        }
      },
    );

    test('refresher throws — 401 surfaced as UnauthorizedError', () async {
      var callCount = 0;

      final dio = createDioClient(
        config: _testConfig,
        tokenReader: () => 'token',
        refresher: () async {
          throw Exception('network error during refresh');
        },
      );
      dio.httpClientAdapter = _CaptureAdapter(
        onFetch: (opts) async {
          callCount++;
          throw _make401(opts);
        },
      );

      // refresher throws — refreshSession() catches and returns null → 401 surfaced
      try {
        await dio.get<dynamic>('/protected');
        fail('Expected DioException');
      } on DioException catch (e) {
        expect(e.error, isA<UnauthorizedError>());
        expect(callCount, 1, reason: 'no retry when refresher throws');
      }
    });
  });

  group('RefreshInterceptor — non-401 passthrough', () {
    test(
      '403 is not intercepted — ForbiddenError, no refresh called',
      () async {
        var refreshCount = 0;

        final dio = createDioClient(
          config: _testConfig,
          tokenReader: () => 'token',
          refresher: () async {
            refreshCount++;
            return 'new-token';
          },
        );
        dio.httpClientAdapter = _CaptureAdapter(
          onFetch: (opts) async => throw _make403(opts),
        );

        try {
          await dio.get<dynamic>('/admin');
          fail('Expected DioException');
        } on DioException catch (e) {
          expect(e.error, isA<ForbiddenError>());
          expect(refreshCount, 0, reason: '403 must never trigger refresh');
        }
      },
    );

    test('500 passes through without refresh', () async {
      var refreshCount = 0;

      final dio = createDioClient(
        config: _testConfig,
        tokenReader: () => 'token',
        refresher: () async {
          refreshCount++;
          return 'new-token';
        },
      );
      dio.httpClientAdapter = _CaptureAdapter(
        onFetch: (opts) async => throw DioException(
          requestOptions: opts,
          response: Response(requestOptions: opts, statusCode: 500),
          type: DioExceptionType.badResponse,
        ),
      );

      try {
        await dio.get<dynamic>('/api');
        fail('Expected DioException');
      } on DioException catch (e) {
        expect(e.error, isA<ServerError>());
        expect(refreshCount, 0);
      }
    });
  });

  group('RefreshInterceptor — no token leak', () {
    test('access token never appears in logs after refresh', () async {
      final logs = <String>[];
      var currentToken = 'secret-access-token-old';

      final dio = createDioClient(
        config: _testConfig,
        tokenReader: () => currentToken,
        logger: logs.add,
        refresher: () async {
          currentToken = 'secret-access-token-new';
          return 'secret-access-token-new';
        },
      );

      var first = true;
      dio.httpClientAdapter = _CaptureAdapter(
        onFetch: (opts) async {
          if (first) {
            first = false;
            throw _make401(opts);
          }
          return ResponseBody.fromString('{}', 200);
        },
      );

      await dio.get<dynamic>('/sensitive');

      for (final entry in logs) {
        expect(
          entry,
          isNot(contains('secret-access-token-old')),
          reason: 'old access token must not appear in logs',
        );
        expect(
          entry,
          isNot(contains('secret-access-token-new')),
          reason: 'new access token must not appear in logs',
        );
      }
    });
  });

  group('createDioClient — 401 without refresher', () {
    test(
      '401 becomes UnauthorizedError without retry when no refresher',
      () async {
        var requestCount = 0;

        final dio = createDioClient(
          config: _testConfig,
          tokenReader: () => 'token',
        );
        dio.httpClientAdapter = _CaptureAdapter(
          onFetch: (opts) async {
            requestCount++;
            throw _make401(opts);
          },
        );

        try {
          await dio.get<dynamic>('/protected');
          fail('Expected DioException');
        } on DioException catch (e) {
          expect(e.error, isA<UnauthorizedError>());
          expect(requestCount, 1, reason: 'no retry without refresher');
        }
      },
    );
  });
}
