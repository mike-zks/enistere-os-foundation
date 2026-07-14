import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/core/api/app_api_error.dart';
import 'package:mobile_flutter/src/core/api/error_interceptor.dart';

DioException _makeError({
  required DioExceptionType type,
  int? statusCode,
  dynamic responseData,
}) {
  final options = RequestOptions(path: '/test');
  return DioException(
    requestOptions: options,
    type: type,
    response: statusCode != null
        ? Response(
            requestOptions: options,
            statusCode: statusCode,
            data: responseData,
          )
        : null,
  );
}

// Mock adapter that returns a fixed status code for any request.
class _StatusAdapter implements HttpClientAdapter {
  _StatusAdapter(this.statusCode);
  final int statusCode;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    if (statusCode >= 400) {
      throw DioException(
        requestOptions: options,
        response: Response(
          requestOptions: options,
          statusCode: statusCode,
          data: statusCode == 422
              ? <String, dynamic>{'field': 'required'}
              : null,
        ),
        type: DioExceptionType.badResponse,
      );
    }
    return ResponseBody.fromString('{}', statusCode);
  }

  @override
  void close({bool force = false}) {}
}

Dio _dioWithStatus(int statusCode) {
  final dio = Dio(BaseOptions(baseUrl: 'http://test'));
  dio.interceptors.add(const ErrorInterceptor());
  dio.httpClientAdapter = _StatusAdapter(statusCode);
  return dio;
}

void main() {
  group('mapDioError — pure mapping', () {
    test('connectionTimeout → TimeoutError', () {
      final err = _makeError(type: DioExceptionType.connectionTimeout);
      expect(mapDioError(err), isA<TimeoutError>());
    });

    test('receiveTimeout → TimeoutError', () {
      final err = _makeError(type: DioExceptionType.receiveTimeout);
      expect(mapDioError(err), isA<TimeoutError>());
    });

    test('sendTimeout → TimeoutError', () {
      final err = _makeError(type: DioExceptionType.sendTimeout);
      expect(mapDioError(err), isA<TimeoutError>());
    });

    test('connectionError → NetworkError', () {
      final err = _makeError(type: DioExceptionType.connectionError);
      expect(mapDioError(err), isA<NetworkError>());
    });

    test('cancel → NetworkError', () {
      final err = _makeError(type: DioExceptionType.cancel);
      expect(mapDioError(err), isA<NetworkError>());
    });

    test('no statusCode → UnknownApiError', () {
      final err = _makeError(type: DioExceptionType.unknown);
      expect(mapDioError(err), isA<UnknownApiError>());
    });

    test('401 → UnauthorizedError', () {
      final err = _makeError(
        type: DioExceptionType.badResponse,
        statusCode: 401,
      );
      expect(mapDioError(err), isA<UnauthorizedError>());
    });

    test('403 → ForbiddenError', () {
      final err = _makeError(
        type: DioExceptionType.badResponse,
        statusCode: 403,
      );
      expect(mapDioError(err), isA<ForbiddenError>());
    });

    test('404 → NotFoundError', () {
      final err = _makeError(
        type: DioExceptionType.badResponse,
        statusCode: 404,
      );
      expect(mapDioError(err), isA<NotFoundError>());
    });

    test('413 → TooLargeError', () {
      final err = _makeError(
        type: DioExceptionType.badResponse,
        statusCode: 413,
      );
      expect(mapDioError(err), isA<TooLargeError>());
    });

    test('415 → UnsupportedTypeError', () {
      final err = _makeError(
        type: DioExceptionType.badResponse,
        statusCode: 415,
      );
      expect(mapDioError(err), isA<UnsupportedTypeError>());
    });

    test('422 → ValidationError with errors map', () {
      final err = _makeError(
        type: DioExceptionType.badResponse,
        statusCode: 422,
        responseData: <String, dynamic>{'email': 'required'},
      );
      final result = mapDioError(err);
      expect(result, isA<ValidationError>());
      expect((result as ValidationError).errors, equals({'email': 'required'}));
    });

    test('429 → RateLimitedError', () {
      final err = _makeError(
        type: DioExceptionType.badResponse,
        statusCode: 429,
      );
      expect(mapDioError(err), isA<RateLimitedError>());
    });

    test('500 → ServerError with statusCode', () {
      final err = _makeError(
        type: DioExceptionType.badResponse,
        statusCode: 500,
      );
      final result = mapDioError(err);
      expect(result, isA<ServerError>());
      expect((result as ServerError).statusCode, 500);
    });

    test('503 → ServerError (>= 500)', () {
      final err = _makeError(
        type: DioExceptionType.badResponse,
        statusCode: 503,
      );
      expect(mapDioError(err), isA<ServerError>());
    });

    test('418 → UnknownApiError with statusCode', () {
      final err = _makeError(
        type: DioExceptionType.badResponse,
        statusCode: 418,
      );
      final result = mapDioError(err);
      expect(result, isA<UnknownApiError>());
      expect((result as UnknownApiError).statusCode, 418);
    });
  });

  group('ErrorInterceptor — through Dio chain', () {
    test('401 response → DioException wraps UnauthorizedError', () async {
      final dio = _dioWithStatus(401);
      try {
        await dio.get('/test');
        fail('Expected DioException');
      } on DioException catch (e) {
        expect(e.error, isA<UnauthorizedError>());
      }
    });

    test('500 response → DioException wraps ServerError', () async {
      final dio = _dioWithStatus(500);
      try {
        await dio.get('/test');
        fail('Expected DioException');
      } on DioException catch (e) {
        expect(e.error, isA<ServerError>());
      }
    });

    test('200 response passes through without error', () async {
      final dio = _dioWithStatus(200);
      final response = await dio.get('/test');
      expect(response.statusCode, 200);
    });
  });
}
