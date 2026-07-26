const pushHookContractVersion = 'push-hook/2.0.0';

abstract interface class PushHook {
  String get contractVersion;
  bool get enabled;
  Future<String> register();
  Future<void> unregister();
}

final class DisabledPushHook implements PushHook {
  const DisabledPushHook();

  @override
  String get contractVersion => pushHookContractVersion;

  @override
  bool get enabled => false;

  @override
  Future<String> register() async => 'disabled';

  @override
  Future<void> unregister() async {}
}
