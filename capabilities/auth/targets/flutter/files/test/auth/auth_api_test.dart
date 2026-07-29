import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/auth/auth_api.dart';
import 'package:mobile_flutter/src/auth/auth_errors.dart';
import 'package:mobile_flutter/src/core/api/dio_client.dart';
import 'package:mobile_flutter/src/core/config/api_config.dart';

/// Replays a scripted answer per call and keeps what was actually sent.
final class _ScriptedAdapter implements HttpClientAdapter {
  _ScriptedAdapter(this._answers);

  final List<({int status, Map<String, dynamic> body})> _answers;
  final requests = <RequestOptions>[];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    final answer = _answers[requests.length - 1];
    return ResponseBody.fromString(
      jsonEncode(answer.body),
      answer.status,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

AuthApi _apiAnswering(List<({int status, Map<String, dynamic> body})> answers) {
  final dio = createDioClient(config: const ApiConfig(baseUrl: ''))
    ..httpClientAdapter = _ScriptedAdapter(answers);
  return AuthApi(dio);
}

Future<AuthError> _failureOf(Future<void> Function() call) async {
  try {
    await call();
  } on AuthError catch (error) {
    return error;
  }
  fail('expected an AuthError');
}

void main() {
  const ({int status, Map<String, dynamic> body}) rejection = (
    status: 401,
    body: {
      'statusCode': 401,
      'errorCode': 'AUTH_INVALID_CREDENTIALS',
      'message': 'Invalid credentials',
      'requestId': 'req-42',
    },
  );

  test(
    'mot de passe faux et compte inconnu donnent le MÊME message générique',
    () async {
      final wrongPassword = await _failureOf(
        () => _apiAnswering([rejection]).login('ada@example.test', 'wrong'),
      );
      final unknownAccount = await _failureOf(
        () => _apiAnswering([rejection]).login('ghost@example.test', 'wrong'),
      );

      // Distinguishing the two would turn the login form into an account
      // enumerator, which is precisely what the authority refuses to do.
      expect(wrongPassword.message, unknownAccount.message);
      expect(wrongPassword.message, genericCredentialsMessage);
    },
  );

  test(
    'conserve le requestId et ne divulgue jamais le secret soumis',
    () async {
      final failure = await _failureOf(
        () => _apiAnswering([rejection]).login('ada@example.test', 'hunter2'),
      );

      expect(failure.requestId, 'req-42');
      expect(failure.message, isNot(contains('hunter2')));
      expect(failure.toString(), isNot(contains('hunter2')));
      expect(failure.toString(), isNot(contains('AUTH_INVALID_CREDENTIALS')));
    },
  );

  test('une réponse malformée est un échec, jamais une demi-session', () async {
    final failure = await _failureOf(
      () => _apiAnswering([
        (status: 200, body: {'accessToken': 'access-1'}),
      ]).login('ada@example.test', 'hunter2'),
    );

    expect(failure.message, genericCredentialsMessage);
  });

  test('logout avale l’échec distant : la garantie est ailleurs', () async {
    final api = _apiAnswering([
      (status: 503, body: {'errorCode': 'SERVICE_UNAVAILABLE'}),
    ]);

    await expectLater(api.logout('refresh-1'), completes);
  });
}
