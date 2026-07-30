import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/features/auth/auth_api.dart';
import 'package:mobile_flutter/src/features/auth/auth_controller.dart';
import 'package:mobile_flutter/src/features/auth/credential_store.dart';
import 'package:mobile_flutter/src/core/api/app_api_error.dart';
import 'package:mobile_flutter/src/core/api/dio_provider.dart';

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

const Map<String, dynamic> _session = {
  'user': {'id': 'u-1', 'email': 'ada@example.test', 'status': 'active'},
  'accessToken': 'access-2',
  'refreshToken': 'refresh-2',
  'tokenType': 'Bearer',
  'accessTokenExpiresIn': 900,
  'refreshTokenExpiresIn': 2592000,
};

void main() {
  late InMemoryCredentialStore store;
  late ProviderContainer container;

  setUp(() {
    store = InMemoryCredentialStore();
    container = ProviderContainer(
      overrides: [credentialStoreProvider.overrideWithValue(store)],
    );
    addTearDown(container.dispose);
  });

  test('401 → un seul refresh puis un seul rejeu', () async {
    await store.write('refresh-1');
    // The protected client answers 401 once; if it were called twice the retry
    // would be looping through the interceptor that triggered it.
    final protected = _ScriptedAdapter([
      (status: 401, body: {'errorCode': 'UNAUTHORIZED'}),
    ]);
    final authority = _ScriptedAdapter([
      (status: 200, body: _session),
      (status: 200, body: {'ok': true}),
    ]);
    container.read(dioClientProvider).httpClientAdapter = protected;
    container.read(authTransportProvider).httpClientAdapter = authority;

    final response = await container
        .read(dioClientProvider)
        .get<Map<String, dynamic>>('/api/v1/items');

    expect(response.data, {'ok': true});
    expect(protected.requests.length, 1);
    expect(authority.requests.length, 2);
    expect(authority.requests[0].path, '/api/v1/auth/refresh');
    expect(authority.requests[1].headers['Authorization'], 'Bearer access-2');
    expect(await store.read(), 'refresh-2');
  });

  test('refresh impossible → l’erreur 401 remonte, aucun rejeu', () async {
    final protected = _ScriptedAdapter([
      (status: 401, body: {'errorCode': 'UNAUTHORIZED'}),
    ]);
    final authority = _ScriptedAdapter([]);
    container.read(dioClientProvider).httpClientAdapter = protected;
    container.read(authTransportProvider).httpClientAdapter = authority;

    await expectLater(
      container.read(dioClientProvider).get<void>('/api/v1/items'),
      throwsA(
        isA<DioException>().having(
          (error) => error.error,
          'canonical error',
          isA<UnauthorizedError>(),
        ),
      ),
    );

    // No stored credential means no session to recover: the authority is never
    // asked, and the original 401 reaches the caller mapped as usual.
    expect(authority.requests, isEmpty);
    expect(protected.requests.length, 1);
  });

  test(
    'la couture compose bien l’intercepteur dans le client de base',
    () async {
      await store.write('refresh-1');
      final authority = _ScriptedAdapter([(status: 200, body: _session)]);
      container.read(authTransportProvider).httpClientAdapter = authority;
      await container.read(authControllerProvider.notifier).refresh();

      final protected = _ScriptedAdapter([
        (status: 200, body: {'ok': true}),
      ]);
      container.read(dioClientProvider).httpClientAdapter = protected;
      await container.read(dioClientProvider).get<Map<String, dynamic>>('/x');

      // The bearer only reaches the protected client if capability_interceptors
      // actually wired authInterceptorFactory into createDioClient.
      expect(
        protected.requests.single.headers['Authorization'],
        'Bearer access-2',
      );
    },
  );
}
