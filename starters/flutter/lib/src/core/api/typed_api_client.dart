import '../platform/runtime_contract.dart';

final class MobileTransportResponse {
  const MobileTransportResponse({
    required this.ok,
    required this.statusCode,
    required this.body,
  });

  final bool ok;
  final int statusCode;
  final Object? body;
}

typedef MobileTransport =
    Future<MobileTransportResponse> Function(
      String path,
      String method,
      Map<String, String> headers,
    );

final class TypedMobileApiClient {
  const TypedMobileApiClient({
    required MobileTransport transport,
    required MobileRequestContext Function() contextFactory,
  }) : _transport = transport,
       _contextFactory = contextFactory;

  final MobileTransport _transport;
  final MobileRequestContext Function() _contextFactory;

  Future<T> request<T>(
    String path, {
    String method = 'GET',
    required T Function(Object? body) decode,
  }) async {
    final context = _contextFactory();
    final response = await _transport(path, method, {
      'X-Request-Id': context.requestId,
      'traceparent': context.traceparent,
    });
    if (!response.ok) throw CanonicalMobileError.fromJson(response.body);
    return decode(response.body);
  }
}
