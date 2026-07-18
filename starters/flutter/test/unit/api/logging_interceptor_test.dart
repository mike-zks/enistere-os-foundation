import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/core/api/logging_interceptor.dart';

class _MockAdapter implements HttpClientAdapter {
  _MockAdapter({this.statusCode = 200, this.onRequest});
  final int statusCode;
  final void Function(RequestOptions options)? onRequest;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    onRequest?.call(options);
    return ResponseBody.fromString('{}', statusCode);
  }

  @override
  void close({bool force = false}) {}
}

Dio _dioWithLogging(List<String> logs, {String token = ''}) {
  final dio = Dio(BaseOptions(baseUrl: 'http://test'));
  if (token.isNotEmpty) {
    dio.options.headers['Authorization'] = 'Bearer $token';
  }
  dio.interceptors.add(LoggingInterceptor(log: logs.add));
  dio.httpClientAdapter = _MockAdapter();
  return dio;
}

void main() {
  group('LoggingInterceptor', () {
    test('logs method and path on request', () async {
      final logs = <String>[];
      final dio = _dioWithLogging(logs);
      await dio.get('/health');

      expect(logs, anyElement(contains('GET')));
      expect(logs, anyElement(contains('/health')));
    });

    test('logs status code on response', () async {
      final logs = <String>[];
      final dio = _dioWithLogging(logs);
      await dio.get('/ping');

      expect(logs, anyElement(contains('200')));
      expect(logs, anyElement(contains('/ping')));
    });

    test('never logs Authorization header value', () async {
      final logs = <String>[];
      final secretToken = 'super-secret-bearer-token';
      final dio = _dioWithLogging(logs, token: secretToken);
      await dio.get('/secure');

      for (final entry in logs) {
        expect(entry, isNot(contains(secretToken)));
        expect(entry.toLowerCase(), isNot(contains('authorization')));
      }
    });

    test('never logs request body', () async {
      final logs = <String>[];
      final dio = _dioWithLogging(logs);
      await dio.post('/data', data: {'password': 'hunter2', 'secret': 'xyz'});

      for (final entry in logs) {
        expect(entry, isNot(contains('hunter2')));
        expect(entry, isNot(contains('xyz')));
        expect(entry, isNot(contains('password')));
      }
    });

    test('logs error status code and path on error response', () async {
      final logs = <String>[];
      final dio = Dio(BaseOptions(baseUrl: 'http://test'));
      dio.interceptors.add(LoggingInterceptor(log: logs.add));
      dio.httpClientAdapter = _MockAdapter(
        statusCode: 500,
        onRequest: (options) {
          throw DioException(
            requestOptions: options,
            response: Response(requestOptions: options, statusCode: 500),
            type: DioExceptionType.badResponse,
          );
        },
      );

      try {
        await dio.get('/broken');
      } on DioException {
        // expected
      }

      expect(logs, anyElement(contains('500')));
    });

    test('no log emitted when logger is null', () async {
      final dio = Dio(BaseOptions(baseUrl: 'http://test'));
      dio.interceptors.add(const LoggingInterceptor());
      dio.httpClientAdapter = _MockAdapter();

      // Should not throw
      await dio.get('/silent');
    });
  });
}
