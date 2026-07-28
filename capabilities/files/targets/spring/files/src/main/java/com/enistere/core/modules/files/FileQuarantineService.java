package com.enistere.core.modules.files;

import com.enistere.core.common.exception.CodedException;
import com.enistere.core.infrastructure.storage.StorageService;
import com.enistere.core.modules.audit.AuditService;
import com.enistere.core.modules.users.User;
import com.enistere.core.modules.users.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Administrative suspension of access to a file.
 *
 * <p>Separate from {@link FileService} because the authority differs: the
 * owner-facing operations are authorised by ownership, these by a permission
 * held without ownership — an administrator acts on somebody else's file, and
 * the owner cannot act on their own. Quota and maintenance were already split
 * out for the same kind of reason; leaving quarantine inside the file service
 * was the odd one out.
 */
@Service
@Transactional
public class FileQuarantineService {

    private final StoredFileRepository repository;
    private final StorageService storageService;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public FileQuarantineService(StoredFileRepository repository, StorageService storageService,
                                 UserRepository userRepository, AuditService auditService) {
        this.repository = repository;
        this.storageService = storageService;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    /**
     * Quarantines a file: no download and no signed URL until an explicit
     * release.
     *
     * <p>Only a VALIDATED file can be quarantined, and the transition is applied
     * conditionally so a concurrent deletion wins rather than being undone.
     * Idempotent on an already-quarantined file.
     */
    public void quarantine(UUID fileId, String actorEmail, String ipAddress, String userAgent) {
        User actor = requireUser(actorEmail);
        StoredFile file = requireFile(fileId);

        if (file.getStatus() == FileStatus.QUARANTINED) {
            return;
        }
        if (file.getStatus() != FileStatus.VALIDATED) {
            throw quarantineConflict();
        }
        if (repository.transitionStatus(
                fileId, FileStatus.VALIDATED, FileStatus.QUARANTINED, Instant.now()) == 0) {
            throw quarantineConflict();
        }
        auditService.record(FilesAuditEvents.QUARANTINED, actor.getId(), "file",
            fileId.toString(), ipAddress, userAgent);
    }

    /**
     * Releases a quarantine, and only onto a file whose object is still there:
     * restoring a record whose object has vanished would advertise a file that
     * cannot be downloaded.
     *
     * <p>No scan is re-run — the decision is administrative and manual.
     * Idempotent on an already-validated file.
     */
    public void restore(UUID fileId, String actorEmail, String ipAddress, String userAgent) {
        User actor = requireUser(actorEmail);
        StoredFile file = requireFile(fileId);

        if (file.getStatus() == FileStatus.VALIDATED) {
            return;
        }
        if (file.getStatus() != FileStatus.QUARANTINED) {
            throw restoreConflict();
        }
        if (!storageService.objectExists(file.getStorageKey())) {
            auditService.record(FilesAuditEvents.STORAGE_OBJECT_MISSING, actor.getId(), "file",
                fileId.toString(), ipAddress, userAgent);
            throw restoreConflict();
        }
        if (repository.transitionStatus(
                fileId, FileStatus.QUARANTINED, FileStatus.VALIDATED, Instant.now()) == 0) {
            throw restoreConflict();
        }
        auditService.record(FilesAuditEvents.QUARANTINE_RELEASED, actor.getId(), "file",
            fileId.toString(), ipAddress, userAgent);
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new CodedException(
                HttpStatus.UNAUTHORIZED, FilesErrorCodes.FILE_NOT_FOUND, "User not found"));
    }

    /** No ownership filter: authority here comes from the permission. */
    private StoredFile requireFile(UUID fileId) {
        return repository.findById(fileId)
            .orElseThrow(() -> new CodedException(
                HttpStatus.NOT_FOUND, FilesErrorCodes.FILE_NOT_FOUND, "File not found"));
    }

    private static CodedException quarantineConflict() {
        // Says the transition is impossible, never which status blocks it.
        return new CodedException(HttpStatus.CONFLICT,
            FilesErrorCodes.FILE_QUARANTINE_INVALID_STATUS,
            "File cannot be quarantined from its current status");
    }

    private static CodedException restoreConflict() {
        return new CodedException(HttpStatus.CONFLICT,
            FilesErrorCodes.FILE_RESTORE_INVALID_STATUS,
            "File cannot be restored from its current status");
    }
}
