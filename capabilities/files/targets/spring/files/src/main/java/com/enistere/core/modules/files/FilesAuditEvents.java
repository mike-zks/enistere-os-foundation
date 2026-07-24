package com.enistere.core.modules.files;

/**
 * Audit event types emitted by the Files capability. The base audit infrastructure
 * imposes no registry (ADR-055 §5 / ADR-056): this capability declares its own
 * stable identifiers and records them via the base AuditService.
 */
public final class FilesAuditEvents {

    private FilesAuditEvents() {
    }

    public static final String FILE_UPLOADED = "FILES_UPLOADED";
    public static final String DOWNLOAD_URL_ISSUED = "FILES_DOWNLOAD_URL_ISSUED";
}
