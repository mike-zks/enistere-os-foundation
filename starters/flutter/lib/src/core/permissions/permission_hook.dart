enum PermissionStatus { unknown, denied, granted, blocked, unavailable }

abstract interface class PermissionHook {
  Future<PermissionStatus> status(String permission);
  Future<PermissionStatus> request(String permission);
}

final class DisabledPermissionHook implements PermissionHook {
  const DisabledPermissionHook();

  @override
  Future<PermissionStatus> request(String permission) async {
    return PermissionStatus.unavailable;
  }

  @override
  Future<PermissionStatus> status(String permission) async {
    return PermissionStatus.unavailable;
  }
}
