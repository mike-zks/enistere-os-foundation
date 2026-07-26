import 'dart:async';

const commonRuntimeContractVersion = 'common/2.0.0';
const mobileRuntimeContractVersion = 'mobile/2.0.0';
const telemetryExporterContractVersion = 'telemetry-exporter/2.0.0';
const mobileExtensionContractVersion = 'mobile-extension/2.0.0';

enum RuntimeEnvironment { local, staging, production }

final class RuntimeConfiguration {
  const RuntimeConfiguration({
    required this.environment,
    required this.apiBaseUrl,
    required this.requestTimeout,
  });

  final RuntimeEnvironment environment;
  final Uri apiBaseUrl;
  final Duration requestTimeout;

  static RuntimeConfiguration parse(Map<String, String?> values) {
    final environment = switch (values['APP_ENV'] ?? 'local') {
      'local' => RuntimeEnvironment.local,
      'staging' => RuntimeEnvironment.staging,
      'production' => RuntimeEnvironment.production,
      _ => throw const FormatException(
        'APP_ENV must be local, staging or production.',
      ),
    };
    final apiBaseUrl = Uri.tryParse(
      values['API_BASE_URL'] ?? 'http://localhost:3000',
    );
    if (apiBaseUrl == null ||
        !apiBaseUrl.hasScheme ||
        !apiBaseUrl.hasAuthority) {
      throw const FormatException('API_BASE_URL must be an absolute URI.');
    }
    if (environment == RuntimeEnvironment.production &&
        apiBaseUrl.scheme != 'https') {
      throw const FormatException('Production API endpoints must use HTTPS.');
    }
    final timeoutMs = int.tryParse(values['API_TIMEOUT_MS'] ?? '15000');
    if (timeoutMs == null || timeoutMs < 100 || timeoutMs > 120000) {
      throw const FormatException(
        'API_TIMEOUT_MS must be between 100 and 120000.',
      );
    }
    return RuntimeConfiguration(
      environment: environment,
      apiBaseUrl: apiBaseUrl,
      requestTimeout: Duration(milliseconds: timeoutMs),
    );
  }
}

final class CanonicalMobileError implements Exception {
  const CanonicalMobileError({
    required this.statusCode,
    required this.errorCode,
    required this.message,
    required this.details,
    required this.path,
    required this.timestamp,
    required this.requestId,
  });

  factory CanonicalMobileError.fromJson(Object? value) {
    if (value case {
      'statusCode': final int statusCode,
      'errorCode': final String errorCode,
      'message': final String message,
      'path': final String path,
      'timestamp': final String timestamp,
      'requestId': final String requestId,
    }) {
      final parsedTimestamp = DateTime.tryParse(timestamp);
      if (parsedTimestamp != null) {
        return CanonicalMobileError(
          statusCode: statusCode,
          errorCode: errorCode,
          message: message,
          details: (value as Map<String, Object?>)['details'],
          path: path,
          timestamp: parsedTimestamp.toUtc(),
          requestId: requestId,
        );
      }
    }
    return CanonicalMobileError(
      statusCode: 0,
      errorCode: 'NETWORK_ERROR',
      message: 'The request could not be completed.',
      details: null,
      path: '',
      timestamp: DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
      requestId: '',
    );
  }

  final int statusCode;
  final String errorCode;
  final String message;
  final Object? details;
  final String path;
  final DateTime timestamp;
  final String requestId;
}

final _traceparent = RegExp(
  r'^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$',
);

final class MobileRequestContext {
  const MobileRequestContext({
    required this.requestId,
    required this.traceparent,
  });

  factory MobileRequestContext.create({
    required String requestId,
    required String Function() nextTraceId,
    required String Function() nextSpanId,
    String? incomingTraceparent,
  }) {
    if (requestId.trim().isEmpty) throw ArgumentError('requestId is required.');
    final incoming = incomingTraceparent == null
        ? null
        : _traceparent.firstMatch(incomingTraceparent.toLowerCase());
    final traceId = incoming?.group(1) ?? nextTraceId();
    final spanId = nextSpanId();
    final flags = incoming?.group(3) ?? '01';
    if (!RegExp(r'^[0-9a-f]{32}$').hasMatch(traceId) ||
        !RegExp(r'^[0-9a-f]{16}$').hasMatch(spanId)) {
      throw const FormatException('Invalid W3C trace or span identifier.');
    }
    return MobileRequestContext(
      requestId: requestId,
      traceparent: '00-$traceId-$spanId-$flags',
    );
  }

  final String requestId;
  final String traceparent;
}

const _sensitiveKeys = <String>{
  'authorization',
  'cookie',
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'apikey',
  'email',
  'phone',
};

Object? redactRuntimeValue(Object? value) {
  if (value is Map) {
    return <String, Object?>{
      for (final entry in value.entries)
        entry.key.toString():
            _sensitiveKeys.contains(
              entry.key.toString().toLowerCase().replaceAll(
                RegExp('[^a-z0-9]'),
                '',
              ),
            )
            ? '[Redacted]'
            : redactRuntimeValue(entry.value),
    };
  }
  if (value is Iterable) return value.map(redactRuntimeValue).toList();
  if (value is String) {
    return value.replaceAll(
      RegExp(r'Bearer\s+[A-Za-z0-9._~+/-]+', caseSensitive: false),
      'Bearer [Redacted]',
    );
  }
  if (value is Error || value is Exception) return value.runtimeType.toString();
  return value;
}

typedef StructuredSink = void Function(Map<String, Object?> record);

final class StructuredLogger {
  StructuredLogger(this._sink, {DateTime Function()? clock})
    : _clock = clock ?? DateTime.now;

  final StructuredSink _sink;
  final DateTime Function() _clock;

  void log(
    String level,
    String message, {
    MobileRequestContext? context,
    Map<String, Object?> fields = const {},
  }) {
    _sink(
      Map.unmodifiable(
        redactRuntimeValue(<String, Object?>{
              'level': level,
              'message': message,
              'timestamp': _clock().toUtc().toIso8601String(),
              if (context != null) 'requestId': context.requestId,
              if (context != null) 'traceparent': context.traceparent,
              'fields': fields,
            })
            as Map<String, Object?>,
      ),
    );
  }
}

final class TechnicalAudit {
  TechnicalAudit(this._sink, {DateTime Function()? clock})
    : _clock = clock ?? DateTime.now;

  final StructuredSink _sink;
  final DateTime Function() _clock;

  void record(
    String action,
    String outcome,
    MobileRequestContext context, {
    Map<String, Object?> fields = const {},
  }) {
    _sink(
      Map.unmodifiable(
        redactRuntimeValue(<String, Object?>{
              'eventType': 'technical-audit',
              'action': action,
              'outcome': outcome,
              'requestId': context.requestId,
              'traceparent': context.traceparent,
              'timestamp': _clock().toUtc().toIso8601String(),
              'fields': fields,
            })
            as Map<String, Object?>,
      ),
    );
  }
}

abstract interface class MobileTelemetryExporter {
  String get contractVersion;
  void export(Map<String, Object?> record);
}

final class RuntimeTelemetry {
  RuntimeTelemetry(this._exporter, {DateTime Function()? clock})
    : _clock = clock ?? DateTime.now {
    if (_exporter.contractVersion != telemetryExporterContractVersion) {
      throw ArgumentError('Unsupported telemetry exporter contract.');
    }
  }

  final MobileTelemetryExporter _exporter;
  final DateTime Function() _clock;
  final Map<String, int> _counters = {};

  void record(
    String name,
    MobileRequestContext context, {
    Map<String, Object?> fields = const {},
  }) {
    _counters[name] = (_counters[name] ?? 0) + 1;
    _exporter.export(
      Map.unmodifiable(
        redactRuntimeValue(<String, Object?>{
              'name': name,
              'timestamp': _clock().toUtc().toIso8601String(),
              'requestId': context.requestId,
              'traceparent': context.traceparent,
              'fields': fields,
            })
            as Map<String, Object?>,
      ),
    );
  }

  int count(String name) => _counters[name] ?? 0;
}

abstract interface class DiagnosticCheck {
  String get id;
  String run();
}

final class RuntimeDiagnostics {
  final Map<String, DiagnosticCheck> _checks = {};

  void register(DiagnosticCheck check) {
    if (!RegExp(r'^[a-z][a-z0-9.-]*$').hasMatch(check.id) ||
        _checks.containsKey(check.id)) {
      throw ArgumentError('Invalid or duplicate diagnostic check: ${check.id}');
    }
    _checks[check.id] = check;
  }

  List<Map<String, String>> snapshot() {
    final checks = _checks.values.toList()
      ..sort((left, right) => left.id.compareTo(right.id));
    return List.unmodifiable(
      checks.map(
        (check) => Map<String, String>.unmodifiable({
          'id': check.id,
          'status': check.run(),
        }),
      ),
    );
  }
}

abstract interface class RuntimeLifecycleHook {
  String get id;
  FutureOr<void> start();
  FutureOr<void> stop();
}

final class RuntimeLifecycle {
  RuntimeLifecycle(this._hooks);

  final List<RuntimeLifecycleHook> _hooks;
  final List<RuntimeLifecycleHook> _started = [];

  Future<void> start() async {
    if (_started.isNotEmpty) return;
    for (final hook in _hooks) {
      await hook.start();
      _started.add(hook);
    }
  }

  Future<void> stop() async {
    for (final hook in _started.reversed) {
      await hook.stop();
    }
    _started.clear();
  }
}

enum MobileExtensionKind {
  secureStorage,
  session,
  offline,
  push,
  crashReporting,
}

abstract interface class MobileRuntimeExtension {
  MobileExtensionKind get kind;
  String get contractVersion;
  String get id;
}

final class MobileRuntimeExtensionRegistry {
  final Map<MobileExtensionKind, MobileRuntimeExtension> _extensions = {};

  void register(MobileRuntimeExtension extension) {
    if (extension.contractVersion != mobileExtensionContractVersion) {
      throw ArgumentError('Unsupported mobile extension contract.');
    }
    if (_extensions.containsKey(extension.kind)) {
      throw StateError('${extension.kind.name} is already registered.');
    }
    _extensions[extension.kind] = extension;
  }

  MobileRuntimeExtension? get(MobileExtensionKind kind) => _extensions[kind];
}
