enum NetworkStatus { unknown, offline, online }

abstract interface class NetworkStateHook {
  NetworkStatus current();
  void Function() subscribe(void Function(NetworkStatus status) listener);
}

final class UnknownNetworkStateHook implements NetworkStateHook {
  const UnknownNetworkStateHook();

  @override
  NetworkStatus current() => NetworkStatus.unknown;

  @override
  void Function() subscribe(void Function(NetworkStatus status) listener) {
    return () {};
  }
}
