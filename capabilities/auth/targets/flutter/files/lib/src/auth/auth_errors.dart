/// Failures the UI may render.
///
/// The message is deliberately generic and identical for every credential
/// failure: telling a caller that an address exists but the password is wrong
/// turns the login form into an account enumerator.
final class AuthError implements Exception {
  const AuthError(this.message, {this.requestId});

  final String message;

  /// Correlation id when the authority provided one — never a reason. It is what
  /// makes a support request traceable without telling the caller which half of
  /// the credential was wrong.
  final String? requestId;

  @override
  String toString() => message;
}

const genericCredentialsMessage = 'Identifiants invalides.';
const genericUnavailableMessage = 'Service indisponible, réessayez.';
