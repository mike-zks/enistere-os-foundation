package com.enistere.core.modules.files;

import com.enistere.core.config.FilesConfig;
import com.enistere.core.infrastructure.storage.StorageService;
import com.enistere.core.modules.audit.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Files reconciliation (ADR-070): brings metadata back in line with what the
 * object store actually holds.
 *
 * <p>Runs under an exclusive advisory lock. Two maintenance passes running at
 * once would race on the same rows and could delete an object one of them had
 * just decided to keep, so a second caller is refused rather than queued —
 * maintenance is not urgent, and a blocked caller holding a connection is worse
 * than a caller told to come back.
 */
@Service
public class FileMaintenanceService {

    private static final Logger log = LoggerFactory.getLogger(FileMaintenanceService.class);
    private static final String LOCK_KEY = "files-maintenance";

    private final StoredFileRepository repository;
    private final StorageService storageService;
    private final FilesConfig filesConfig;
    private final AuditService auditService;

    public FileMaintenanceService(StoredFileRepository repository, StorageService storageService,
                                  FilesConfig filesConfig, AuditService auditService) {
        this.repository = repository;
        this.storageService = storageService;
        this.filesConfig = filesConfig;
        this.auditService = auditService;
    }

    /** Outcome of one maintenance pass. */
    public record MaintenanceReport(int examined, int purged, int keptObjectPresent) {}

    /**
     * Purges deleted records whose retention has elapsed — and only those whose
     * object is confirmed absent.
     *
     * <p>A row whose object is still present is deliberately kept: dropping it
     * would orphan the object for good, with nothing left pointing at it. That
     * inconsistency is signalled through the audit trail instead of being erased.
     *
     * @throws MaintenanceBusyException when another pass already holds the lock
     */
    @Transactional
    public MaintenanceReport purgeDeletedMetadata() {
        if (!repository.tryLockMaintenance(LOCK_KEY)) {
            throw new MaintenanceBusyException();
        }

        Instant cutoff = Instant.now().minusSeconds(filesConfig.getPurgeRetentionSeconds());
        List<StoredFile> candidates = repository.findPurgeCandidates(FileStatus.DELETED, cutoff);

        int purged = 0;
        int kept = 0;
        for (StoredFile file : candidates) {
            if (storageService.objectExists(file.getStorageKey())) {
                auditService.record(FilesAuditEvents.RECONCILIATION_ACTION, null, "file",
                    file.getId().toString(), null, null);
                kept++;
                continue;
            }
            repository.delete(file);
            auditService.record(FilesAuditEvents.PURGED, null, "file",
                file.getId().toString(), null, null);
            purged++;
        }

        log.info("Files maintenance: examined={} purged={} keptObjectPresent={}",
            candidates.size(), purged, kept);
        return new MaintenanceReport(candidates.size(), purged, kept);
    }

    /** Raised when a maintenance pass is already running. */
    public static class MaintenanceBusyException extends RuntimeException {
        public MaintenanceBusyException() {
            super("A files maintenance run is already in progress");
        }
    }
}
