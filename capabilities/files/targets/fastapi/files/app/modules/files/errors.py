from __future__ import annotations


class FilesError(Exception):
    def __init__(self, status_code: int, error_code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.error_code = error_code
        self.message = message


FILE_NOT_FOUND = "FILE_NOT_FOUND"
FILE_REQUIRED = "FILE_REQUIRED"
FILE_INVALID_NAME = "FILE_INVALID_NAME"
FILE_SIZE_EXCEEDED = "FILE_SIZE_EXCEEDED"
FILE_CONTENT_TYPE_UNDETECTED = "FILE_CONTENT_TYPE_UNDETECTED"
FILE_CONTENT_TYPE_MISMATCH = "FILE_CONTENT_TYPE_MISMATCH"
FILE_INVALID_EXTENSION = "FILE_INVALID_EXTENSION"
FILE_STORAGE_UNAVAILABLE = "FILE_STORAGE_UNAVAILABLE"
FILE_FINALIZATION_FAILED = "FILE_FINALIZATION_FAILED"
FILE_QUARANTINE_INVALID_STATUS = "FILE_QUARANTINE_INVALID_STATUS"
FILE_RESTORE_INVALID_STATUS = "FILE_RESTORE_INVALID_STATUS"
FILE_STORAGE_QUOTA_EXCEEDED = "FILE_STORAGE_QUOTA_EXCEEDED"
FILE_MAINTENANCE_BUSY = "FILE_MAINTENANCE_BUSY"


def failure(status: int, code: str, message: str) -> FilesError:
    return FilesError(status, code, message)
