package com.enistere.core.modules.files;

/**
 * Public error codes of the Files capability (ADR-070).
 *
 * <p>Shared with the other API runtimes: a client that handles a refused
 * quarantine transition must be able to do so identically whichever runtime
 * serves it. A status conflict says only that the transition is impossible from
 * the current status — never which status that is, since the caller may have no
 * business knowing the file's state.
 */
public final class FilesErrorCodes {

    private FilesErrorCodes() {
    }

    public static final String FILE_NOT_FOUND = "FILE_NOT_FOUND";
    public static final String FILE_QUARANTINE_INVALID_STATUS = "FILE_QUARANTINE_INVALID_STATUS";
    public static final String FILE_RESTORE_INVALID_STATUS = "FILE_RESTORE_INVALID_STATUS";
    public static final String FILE_STORAGE_QUOTA_EXCEEDED = "FILE_STORAGE_QUOTA_EXCEEDED";
}
