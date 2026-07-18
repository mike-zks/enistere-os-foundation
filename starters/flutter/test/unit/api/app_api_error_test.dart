import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/core/api/app_api_error.dart';

void main() {
  group('AppApiError sealed hierarchy', () {
    test('NetworkError is AppApiError and Exception', () {
      const err = NetworkError(message: 'no network');
      expect(err, isA<AppApiError>());
      expect(err, isA<Exception>());
      expect(err.message, 'no network');
    });

    test('TimeoutError is AppApiError', () {
      expect(const TimeoutError(), isA<AppApiError>());
    });

    test('UnauthorizedError is AppApiError', () {
      expect(const UnauthorizedError(), isA<AppApiError>());
    });

    test('ForbiddenError is AppApiError', () {
      expect(const ForbiddenError(), isA<AppApiError>());
    });

    test('NotFoundError is AppApiError', () {
      expect(const NotFoundError(), isA<AppApiError>());
    });

    test('ValidationError exposes errors map', () {
      const err = ValidationError(errors: {'email': 'invalid'});
      expect(err, isA<AppApiError>());
      expect(err.errors, equals({'email': 'invalid'}));
    });

    test('TooLargeError is AppApiError', () {
      expect(const TooLargeError(), isA<AppApiError>());
    });

    test('UnsupportedTypeError is AppApiError', () {
      expect(const UnsupportedTypeError(), isA<AppApiError>());
    });

    test('RateLimitedError is AppApiError', () {
      expect(const RateLimitedError(), isA<AppApiError>());
    });

    test('ServerError exposes statusCode', () {
      const err = ServerError(statusCode: 503);
      expect(err, isA<AppApiError>());
      expect(err.statusCode, 503);
    });

    test('UnknownApiError exposes statusCode and message', () {
      const err = UnknownApiError(statusCode: 418, message: 'teapot');
      expect(err, isA<AppApiError>());
      expect(err.statusCode, 418);
      expect(err.message, 'teapot');
    });

    test('switch on AppApiError is exhaustive at compile time', () {
      AppApiError err = const UnauthorizedError();
      final label = switch (err) {
        NetworkError() => 'network',
        TimeoutError() => 'timeout',
        UnauthorizedError() => 'unauthorized',
        ForbiddenError() => 'forbidden',
        NotFoundError() => 'notFound',
        ValidationError() => 'validation',
        TooLargeError() => 'tooLarge',
        UnsupportedTypeError() => 'unsupportedType',
        RateLimitedError() => 'rateLimited',
        ServerError() => 'server',
        UnknownApiError() => 'unknown',
      };
      expect(label, 'unauthorized');
    });
  });
}
