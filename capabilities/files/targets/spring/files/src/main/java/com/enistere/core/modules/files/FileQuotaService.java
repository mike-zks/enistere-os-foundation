package com.enistere.core.modules.files;

import com.enistere.core.common.exception.CodedException;
import com.enistere.core.modules.files.FilesConfig;
import com.enistere.core.modules.audit.AuditService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Per-owner quotas (ADR-070).
 *
 * <p>Active files consume quota — {@code PENDING}, {@code UPLOADED},
 * {@code VALIDATED} and {@code QUARANTINED}. Rejected and deleted ones do not:
 * an owner is not punished for content the system refused or that they removed.
 * A limit of {@code 0} means unlimited.
 */
@Service
public class FileQuotaService {

    static final List<FileStatus> ACTIVE_STATUSES = List.of(
        FileStatus.PENDING, FileStatus.UPLOADED, FileStatus.VALIDATED, FileStatus.QUARANTINED);

    private final StoredFileRepository repository;
    private final FilesConfig filesConfig;
    private final AuditService auditService;

    public FileQuotaService(StoredFileRepository repository, FilesConfig filesConfig,
                            AuditService auditService) {
        this.repository = repository;
        this.filesConfig = filesConfig;
        this.auditService = auditService;
    }

    /**
     * Reserves a quota slot and persists the record as {@code PENDING}, in one
     * transaction guarded by a per-owner advisory lock.
     *
     * <p>This is the only transaction the reservation needs, and it is short: the
     * advisory lock lives exactly as long as it, never across the upload's network
     * I/O. The caller runs without an ambient transaction precisely so that one
     * upload never holds two connections at once — nesting them exhausts the pool
     * under concurrency, which is the very situation this quota exists to survive.
     */
    @Transactional
    public StoredFile reserveSlot(StoredFile candidate, UUID ownerId, long size,
                                  String ipAddress, String userAgent) {
        repository.lockOwnerForQuota("files-quota:" + ownerId);

        int maxActiveFiles = filesConfig.getOwnerMaxActiveFiles();
        if (maxActiveFiles > 0) {
            long active = repository.countActiveByOwner(ownerId, ACTIVE_STATUSES);
            if (active + 1 > maxActiveFiles) {
                throw rejectQuota(ownerId, ipAddress, userAgent);
            }
        }

        long maxTotalBytes = filesConfig.getOwnerMaxTotalBytes();
        if (maxTotalBytes > 0) {
            long used = repository.sumActiveSizeByOwner(ownerId, ACTIVE_STATUSES);
            if (used + size > maxTotalBytes) {
                throw rejectQuota(ownerId, ipAddress, userAgent);
            }
        }

        candidate.setStatus(FileStatus.PENDING);
        return repository.save(candidate);
    }

    /** Confirms the reservation once the bytes are stored. */
    @Transactional
    public void markUploaded(UUID fileId) {
        repository.transitionStatus(fileId, FileStatus.PENDING, FileStatus.UPLOADED, Instant.now());
    }

    /**
     * Releases a reservation whose content never arrived, so it stops consuming
     * the owner's quota as a phantom.
     */
    @Transactional
    public void releaseReservation(UUID fileId) {
        repository.transitionStatus(fileId, FileStatus.PENDING, FileStatus.REJECTED, Instant.now());
    }

    private CodedException rejectQuota(UUID ownerId, String ipAddress, String userAgent) {
        auditService.record(FilesAuditEvents.QUOTA_EXCEEDED, ownerId, "file",
            null, ipAddress, userAgent);
        // The exact limit is not disclosed — it is operator configuration, not
        // information the caller is owed.
        return new CodedException(HttpStatus.CONFLICT,
            FilesErrorCodes.FILE_STORAGE_QUOTA_EXCEEDED, "Storage quota exceeded");
    }
}
