// Seam for the auth token-refresh API.
// Derived projects wire a real POST /auth/refresh client here (B3).
abstract interface class AuthApi {
  // Exchanges [refreshToken] for a new access token.
  // Throws on network error or server rejection (4xx/5xx).
  Future<String> refresh(String refreshToken);
}

// Foundation V1 placeholder — no real network call.
// Real implementation: POST /auth/refresh → { accessToken }.
class PlaceholderAuthApi implements AuthApi {
  const PlaceholderAuthApi();

  @override
  Future<String> refresh(String refreshToken) async => 'refreshed-access-token';
}
