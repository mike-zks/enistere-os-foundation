import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/features/auth/auth_api.dart';
import 'package:mobile_flutter/src/features/auth/auth_controller.dart';
import 'package:mobile_flutter/src/features/auth/credential_store.dart';
import 'package:mobile_flutter/src/core/api/dio_provider.dart';
import 'package:mobile_flutter/src/features/files/files_api.dart';
import 'package:mobile_flutter/src/features/files/upload_file.dart';

final class _RecordingAdapter implements HttpClientAdapter {
  _RecordingAdapter(this.answers);

  final List<({int status, Map<String, dynamic> body})> answers;
  final requests = <RequestOptions>[];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    final answer = answers[requests.length - 1];
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

const _session = <String, dynamic>{
  'user': {'id': 'u-1', 'email': 'ada@example.test', 'status': 'active'},
  'accessToken': 'access-1',
  'refreshToken': 'refresh-2',
  'tokenType': 'Bearer',
  'accessTokenExpiresIn': 900,
  'refreshTokenExpiresIn': 2592000,
};

const _stored = <String, dynamic>{
  'id': '0198f093-66c1-7200-8000-000000000001',
  'originalName': 'proof.pdf',
  'mimeType': 'application/pdf',
  'size': 5,
  'category': 'DOCUMENT',
  'status': 'active',
  'subjectId': null,
  'createdAt': '2026-08-02T00:00:00Z',
};

void main() {
  test('safeLogDescriptor omet le chemin local et le nom brut', () {
    const file = LocalUploadFile(
      path: '/private/ada/passport.pdf',
      name: 'ada-passport.PDF',
      mediaType: 'application/pdf',
    );

    final safe = file.safeLogDescriptor;
    expect(safe.mediaType, 'application/pdf');
    expect(safe.extension, 'pdf');
    expect(safe.toString(), isNot(contains('/private/ada')));
    expect(safe.toString(), isNot(contains('ada-passport')));
  });

  test('valide forme et type avant toute requête', () async {
    final adapter = _RecordingAdapter([]);
    final dio = Dio()..httpClientAdapter = adapter;
    const invalid = LocalUploadFile(
      path: '/tmp/proof.pdf',
      name: 'proof.pdf',
      mediaType: 'not a media type',
    );

    await expectLater(
      FilesApi(dio).upload(file: invalid, category: FileCategory.document),
      throwsA(isA<FormatException>()),
    );
    expect(adapter.requests, isEmpty);
  });

  test('envoie un multipart par le client authentifié', () async {
    final directory = await Directory.systemTemp.createTemp('files-flutter-');
    addTearDown(() => directory.delete(recursive: true));
    final local = File('${directory.path}/proof.pdf');
    await local.writeAsBytes(<int>[37, 80, 68, 70, 45]);

    final store = InMemoryCredentialStore();
    await store.write('refresh-1');
    final container = ProviderContainer(
      overrides: [credentialStoreProvider.overrideWithValue(store)],
    );
    addTearDown(container.dispose);

    final auth = _RecordingAdapter([(status: 200, body: _session)]);
    final files = _RecordingAdapter([(status: 201, body: _stored)]);
    container.read(authTransportProvider).httpClientAdapter = auth;
    container.read(dioClientProvider).httpClientAdapter = files;
    await container.read(authControllerProvider.notifier).refresh();

    final result = await container
        .read(filesApiProvider)
        .upload(
          file: LocalUploadFile(
            path: local.path,
            name: 'proof.pdf',
            mediaType: 'application/pdf',
          ),
          category: FileCategory.document,
          subjectId: 'claim-42',
        );

    final request = files.requests.single;
    expect(request.path, '/api/v1/files/upload');
    expect(request.headers['Authorization'], 'Bearer access-1');
    expect(request.data, isA<FormData>());
    final form = request.data as FormData;
    expect(Map<String, String>.fromEntries(form.fields), {
      'category': 'DOCUMENT',
      'subjectId': 'claim-42',
    });
    expect(form.files.single.key, 'file');
    expect(form.files.single.value.filename, 'proof.pdf');
    expect(form.files.single.value.contentType.toString(), 'application/pdf');
    expect(result.id, _stored['id']);
    expect(result.mediaType, 'application/pdf');
  });
}
