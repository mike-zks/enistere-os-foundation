const crashReportingHookContractVersion = 'crash-reporting-hook/2.0.0';

abstract interface class CrashReportingHook {
  String get contractVersion;
  void capture(Object error, {Map<String, Object?> context = const {}});
}

final class DisabledCrashReportingHook implements CrashReportingHook {
  const DisabledCrashReportingHook();

  @override
  String get contractVersion => crashReportingHookContractVersion;

  @override
  void capture(Object error, {Map<String, Object?> context = const {}}) {}
}
