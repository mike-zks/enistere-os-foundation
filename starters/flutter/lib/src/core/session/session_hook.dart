const sessionHookContractVersion = 'session-hook/2.0.0';

enum SessionState { unknown, anonymous, authenticated }

abstract interface class SessionHook {
  String get contractVersion;
  SessionState current();
  void Function() subscribe(void Function(SessionState state) listener);
}

final class AnonymousSessionHook implements SessionHook {
  const AnonymousSessionHook();

  @override
  String get contractVersion => sessionHookContractVersion;

  @override
  SessionState current() => SessionState.anonymous;

  @override
  void Function() subscribe(void Function(SessionState state) listener) {
    return () {};
  }
}
