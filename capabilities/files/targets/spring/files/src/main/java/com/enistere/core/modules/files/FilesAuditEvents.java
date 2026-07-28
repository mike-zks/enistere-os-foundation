package com.enistere.core.modules.files;

/**
 * Audit event types emitted by the Files capability. The Platform Baseline audit
 * infrastructure imposes no registry (ADR-055 §5 / ADR-056): this capability
 * declares its own stable identifiers and records them via the base AuditService.
 *
 * <p>The identifiers are shared with the other API runtimes (ADR-070): the same
 * business event must carry the same name whichever runtime produced it, or an
 * audit trail cannot be read across a fleet. Hence the singular {@code FILE_}
 * prefix, matching the NestJS registry.
 */
public final class FilesAuditEvents {

    private FilesAuditEvents() {
    }

    public static final String FILE_UPLOADED = "FILE_UPLOADED";
    public static final String DOWNLOAD_URL_ISSUED = "FILE_DOWNLOAD_URL_ISSUED";
    public static final String METADATA_ACCESSED = "FILE_METADATA_ACCESSED";
    public static final String DELETION_REQUESTED = "FILE_DELETION_REQUESTED";
    public static final String OBJECT_DELETED = "FILE_OBJECT_DELETED";
    public static final String DELETED = "FILE_DELETED";
    public static final String DELETION_FAILED = "FILE_DELETION_FAILED";
    public static final String QUARANTINED = "FILE_QUARANTINED";
    public static final String QUARANTINE_RELEASED = "FILE_QUARANTINE_RELEASED";
    public static final String STORAGE_OBJECT_MISSING = "FILE_STORAGE_OBJECT_MISSING";
    public static final String QUOTA_EXCEEDED = "FILE_QUOTA_EXCEEDED";
    public static final String RECONCILIATION_ACTION = "FILE_RECONCILIATION_ACTION";
    public static final String PURGED = "FILE_ORPHAN_DELETED";
}
