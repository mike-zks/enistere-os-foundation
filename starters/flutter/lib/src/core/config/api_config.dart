class ApiConfig {
  const ApiConfig({
    required this.baseUrl,
    this.connectTimeoutMs = 10000,
    this.receiveTimeoutMs = 30000,
    this.sendTimeoutMs = 30000,
    this.commonHeaders = const <String, String>{},
  });

  final String baseUrl;
  final int connectTimeoutMs;
  final int receiveTimeoutMs;
  final int sendTimeoutMs;
  final Map<String, String> commonHeaders;
}
