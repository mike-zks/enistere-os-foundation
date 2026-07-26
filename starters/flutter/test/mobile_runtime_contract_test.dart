import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_flutter/src/core/api/typed_api_client.dart';
import 'package:mobile_flutter/src/core/crash/crash_reporting_hook.dart';
import 'package:mobile_flutter/src/core/linking/deep_link_policy.dart';
import 'package:mobile_flutter/src/core/network/network_state.dart';
import 'package:mobile_flutter/src/core/offline/offline_hook.dart';
import 'package:mobile_flutter/src/core/permissions/permission_hook.dart';
import 'package:mobile_flutter/src/core/platform/runtime_contract.dart';
import 'package:mobile_flutter/src/core/push/push_hook.dart';
import 'package:mobile_flutter/src/core/session/session_hook.dart';
import 'package:mobile_flutter/src/core/storage/secure_storage.dart';

final class _Exporter implements MobileTelemetryExporter {
  final records = <Map<String, Object?>>[];

  @override
  String get contractVersion => telemetryExporterContractVersion;

  @override
  void export(Map<String, Object?> record) => records.add(record);
}

final class _Check implements DiagnosticCheck {
  const _Check(this.id, this.status);

  @override
  final String id;
  final String status;

  @override
  String run() => status;
}

final class _LifecycleHook implements RuntimeLifecycleHook {
  _LifecycleHook(this.id, this.calls);

  @override
  final String id;
  final List<String> calls;

  @override
  void start() => calls.add('start:$id');

  @override
  void stop() => calls.add('stop:$id');
}

final class _Extension implements MobileRuntimeExtension {
  const _Extension(this.kind, this.id);

  @override
  final MobileExtensionKind kind;
  @override
  final String id;
  @override
  String get contractVersion => mobileExtensionContractVersion;
}

final class _StorageAdapter implements SecureStorageAdapter {
  final values = <String, String>{};

  @override
  String get contractVersion => secureStorageContractVersion;
  @override
  Future<String?> get(String key) async => values[key];
  @override
  Future<void> remove(String key) async => values.remove(key);
  @override
  Future<void> set(String key, String value) async => values[key] = value;
}

void main() {
  final context = MobileRequestContext.create(
    requestId: 'request-1',
    incomingTraceparent: '00-${'a' * 32}-${'b' * 16}-01',
    nextTraceId: () => 'c' * 32,
    nextSpanId: () => 'd' * 16,
  );

  test('validates typed configuration and production transport', () {
    final config = RuntimeConfiguration.parse({
      'APP_ENV': 'production',
      'API_BASE_URL': 'https://api.example.test',
      'API_TIMEOUT_MS': '1200',
    });
    expect(config.environment, RuntimeEnvironment.production);
    expect(config.requestTimeout, const Duration(milliseconds: 1200));
    expect(
      () => RuntimeConfiguration.parse({
        'APP_ENV': 'production',
        'API_BASE_URL': 'http://api.example.test',
      }),
      throwsFormatException,
    );
  });

  test('continues W3C context with a new span', () {
    expect(context.traceparent, '00-${'a' * 32}-${'d' * 16}-01');
  });

  test('structured logging and technical audit redact sensitive fields', () {
    final records = <Map<String, Object?>>[];
    StructuredLogger(
      records.add,
      clock: () => DateTime.utc(2026),
    ).log('info', 'complete', fields: {'token': 'secret'});
    TechnicalAudit(records.add, clock: () => DateTime.utc(2026)).record(
      'runtime.start',
      'success',
      context,
      fields: {'authorization': 'Bearer secret'},
    );
    expect((records[0]['fields']! as Map)['token'], '[Redacted]');
    expect((records[1]['fields']! as Map)['authorization'], '[Redacted]');
  });

  test('versioned telemetry records metrics and correlation', () {
    final exporter = _Exporter();
    final telemetry = RuntimeTelemetry(
      exporter,
      clock: () => DateTime.utc(2026),
    )..record('mobile.request', context);
    expect(telemetry.count('mobile.request'), 1);
    expect(exporter.records.single['traceparent'], context.traceparent);
  });

  test(
    'diagnostics are sorted and lifecycle stops once in reverse order',
    () async {
      final diagnostics = RuntimeDiagnostics()
        ..register(const _Check('network', 'ready'))
        ..register(const _Check('api', 'degraded'));
      expect(diagnostics.snapshot().map((item) => item['id']), [
        'api',
        'network',
      ]);

      final calls = <String>[];
      final lifecycle = RuntimeLifecycle([
        _LifecycleHook('one', calls),
        _LifecycleHook('two', calls),
      ]);
      await lifecycle.start();
      await lifecycle.stop();
      await lifecycle.stop();
      expect(calls, ['start:one', 'start:two', 'stop:two', 'stop:one']);
    },
  );

  test('mobile extension points are versioned and exclusive', () {
    final registry = MobileRuntimeExtensionRegistry()
      ..register(const _Extension(MobileExtensionKind.session, 'anonymous'));
    expect(registry.get(MobileExtensionKind.session)?.id, 'anonymous');
    expect(
      () => registry.register(
        const _Extension(MobileExtensionKind.session, 'duplicate'),
      ),
      throwsStateError,
    );
  });

  test(
    'typed API client propagates correlation and maps canonical errors',
    () async {
      var headers = <String, String>{};
      final client = TypedMobileApiClient(
        contextFactory: () => context,
        transport: (path, method, requestHeaders) async {
          headers = requestHeaders;
          return const MobileTransportResponse(
            ok: false,
            statusCode: 503,
            body: {
              'statusCode': 503,
              'errorCode': 'SERVICE_UNAVAILABLE',
              'message': 'Unavailable',
              'details': null,
              'path': '/v1/items',
              'timestamp': '2026-01-01T00:00:00.000Z',
              'requestId': 'request-1',
            },
          );
        },
      );
      await expectLater(
        client.request<Object?>('/v1/items', decode: (body) => body),
        throwsA(isA<CanonicalMobileError>()),
      );
      expect(headers['traceparent'], context.traceparent);
      expect(headers['X-Request-Id'], context.requestId);
    },
  );

  test('neutral mobile hooks expose no capability behavior', () async {
    final storage = SecureStorage(_StorageAdapter());
    await storage.set('runtime.device-key', 'ciphertext');
    expect(await storage.get('runtime.device-key'), 'ciphertext');
    expect(const AnonymousSessionHook().current(), SessionState.anonymous);
    expect(const UnknownNetworkStateHook().current(), NetworkStatus.unknown);
    expect(
      await const DisabledPermissionHook().status('camera'),
      PermissionStatus.unavailable,
    );
    expect(
      const DeepLinkPolicy(
        allowedSchemes: {'enistere'},
        allowedHosts: {'app'},
      ).resolve('enistere://app/home')?.path,
      '/home',
    );
    expect(
      await const DisabledOfflineHook().enqueue(id: '1', kind: 'write'),
      'disabled',
    );
    expect(await const DisabledPushHook().register(), 'disabled');
    expect(
      const DisabledCrashReportingHook().contractVersion,
      crashReportingHookContractVersion,
    );
  });
}
