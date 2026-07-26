const offlineHookContractVersion = 'offline-hook/2.0.0';

abstract interface class OfflineHook {
  String get contractVersion;
  bool get enabled;
  Future<String> enqueue({required String id, required String kind});
}

final class DisabledOfflineHook implements OfflineHook {
  const DisabledOfflineHook();

  @override
  String get contractVersion => offlineHookContractVersion;

  @override
  bool get enabled => false;

  @override
  Future<String> enqueue({required String id, required String kind}) async {
    return 'disabled';
  }
}
