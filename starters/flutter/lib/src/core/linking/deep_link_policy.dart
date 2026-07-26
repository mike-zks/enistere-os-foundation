final class DeepLinkPolicy {
  const DeepLinkPolicy({
    required this.allowedSchemes,
    required this.allowedHosts,
  });

  final Set<String> allowedSchemes;
  final Set<String> allowedHosts;

  Uri? resolve(String input) {
    final uri = Uri.tryParse(input);
    if (uri == null || !allowedSchemes.contains(uri.scheme)) return null;
    if (uri.host.isNotEmpty && !allowedHosts.contains(uri.host)) return null;
    if (uri.pathSegments.any((segment) => segment == '..')) return null;
    return uri;
  }
}
