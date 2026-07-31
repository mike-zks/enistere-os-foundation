package com.enistere.core.modules.files;

import com.enistere.core.common.exception.CodedException;
import com.enistere.core.modules.files.FilesConfig;
import com.enistere.core.infrastructure.storage.StorageService;
import com.enistere.core.modules.audit.AuditService;
import com.enistere.core.modules.files.dto.DownloadUrlResponseDto;
import com.enistere.core.modules.files.dto.FileListResponseDto;
import com.enistere.core.modules.files.dto.StoredFileResponseDto;
import com.enistere.core.modules.users.User;
import com.enistere.core.modules.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class FileService {

    private static final Logger log = LoggerFactory.getLogger(FileService.class);

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf",
        "video/mp4", "video/webm",
        "audio/mpeg", "audio/ogg", "audio/wav",
        "text/plain", "text/csv",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    private final StoredFileRepository repository;
    private final StorageService storageService;
    private final UserRepository userRepository;
    private final FilesConfig filesConfig;
    private final AuditService auditService;
    private final FileQuotaService quotaService;

    public FileService(StoredFileRepository repository, StorageService storageService,
                       UserRepository userRepository, FilesConfig filesConfig,
                       AuditService auditService, FileQuotaService quotaService) {
        this.quotaService = quotaService;
        this.repository = repository;
        this.storageService = storageService;
        this.userRepository = userRepository;
        this.filesConfig = filesConfig;
        this.auditService = auditService;
    }

    /**
     * Runs WITHOUT an ambient transaction: it performs network I/O, and holding a
     * database transaction across an object-store upload would pin a connection
     * for the duration of the transfer. Each database step below opens its own
     * short transaction instead.
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public StoredFileResponseDto upload(MultipartFile file, FileCategory category,
                                        String subjectId, String ownerEmail,
                                        String ipAddress, String userAgent) {
        validateMimeType(file);
        validateSize(file);

        User owner = userRepository.findByEmail(ownerEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        String sanitizedName = sanitizeName(file.getOriginalFilename());
        String extension = extractExtension(file.getOriginalFilename());
        String storageKey = generateStorageKey(category, extension);

        log.info("File upload requested: category={} size={} mimeType={}",
            category, file.getSize(), file.getContentType());

        StoredFile stored = new StoredFile();
        stored.setOriginalName(sanitizedName);
        stored.setStorageKey(storageKey);
        stored.setBucket(filesConfig.getBucket());
        stored.setMimeType(resolvedMimeType(file));
        stored.setExtension(extension);
        stored.setSize(file.getSize());
        stored.setCategory(category);
        stored.setOwnerId(owner.getId());
        stored.setSubjectId(subjectId);

        // The slot is reserved BEFORE the bytes are written. Uploading first and
        // checking after would let a rejected upload leave an object behind, and
        // would spend the transfer only to refuse it.
        stored = quotaService.reserveSlot(stored, owner.getId(), file.getSize(), ipAddress, userAgent);

        try {
            storageService.upload(file.getInputStream(), storageKey, file.getContentType(), file.getSize());
        } catch (IOException | RuntimeException e) {
            // The reservation is released rather than left as a phantom consuming
            // the owner's quota for a file whose content never arrived.
            quotaService.releaseReservation(stored.getId());
            log.error("Storage upload failed: category={} size={} mimeType={}",
                category, file.getSize(), file.getContentType());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Storage failure");
        }

        quotaService.markUploaded(stored.getId());
        stored = repository.findById(stored.getId()).orElseThrow();

        auditService.record(FilesAuditEvents.FILE_UPLOADED, owner.getId(), "file",
            stored.getId().toString(), ipAddress, userAgent);
        return toDto(stored);
    }

    @Transactional(readOnly = true)
    public DownloadUrlResponseDto getDownloadUrl(UUID fileId, String ownerEmail,
                                                  String ipAddress, String userAgent) {
        User owner = userRepository.findByEmail(ownerEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        // A deleted file must not still hand out a download URL: the row survives
        // as a tombstone, so filtering on ownership alone would keep signing keys
        // whose object is already gone. A quarantined file is refused the same
        // way — quarantine exists precisely to cut access off.
        StoredFile file = requireOwnedFile(fileId, owner.getId());
        if (file.getStatus() == FileStatus.QUARANTINED) {
            throw new CodedException(
                HttpStatus.NOT_FOUND, FilesErrorCodes.FILE_NOT_FOUND, "File not found");
        }

        // URL is never logged (ADR-040, §20)
        String url = storageService.generatePresignedDownloadUrl(
            file.getStorageKey(), filesConfig.getPresignedUrlTtlSeconds());

        log.info("Download URL generated: fileId={} category={}", fileId, file.getCategory());

        auditService.record(FilesAuditEvents.DOWNLOAD_URL_ISSUED, owner.getId(), "file",
            fileId.toString(), ipAddress, userAgent);
        return new DownloadUrlResponseDto(fileId, url, filesConfig.getPresignedUrlTtlSeconds());
    }

    /**
     * One page of the caller's own files. Deleted rows are excluded rather than
     * returned with a status: a soft-deleted file must be as invisible to its
     * owner as one that never existed.
     */
    @Transactional(readOnly = true)
    public FileListResponseDto listOwnedFiles(String ownerEmail, int limit, int offset) {
        User owner = requireUser(ownerEmail);
        List<StoredFileResponseDto> items = repository
            .findByOwnerIdAndStatusNotOrderByCreatedAtDescIdDesc(
                owner.getId(), FileStatus.DELETED, PageRequest.of(offset / limit, limit))
            .stream()
            .map(this::toDto)
            .toList();
        long total = repository.countByOwnerIdAndStatusNot(owner.getId(), FileStatus.DELETED);
        Integer nextOffset = offset + items.size() < total ? offset + items.size() : null;
        return new FileListResponseDto(items, nextOffset, total);
    }

    /**
     * Public metadata of one owned file. A file owned by somebody else and a file
     * that does not exist both yield 404 — the caller must not be able to probe
     * for existence.
     */
    @Transactional(readOnly = true)
    public StoredFileResponseDto getMetadata(UUID fileId, String ownerEmail,
                                             String ipAddress, String userAgent) {
        User owner = requireUser(ownerEmail);
        StoredFile file = requireOwnedFile(fileId, owner.getId());
        auditService.record(FilesAuditEvents.METADATA_ACCESSED, owner.getId(), "file",
            fileId.toString(), ipAddress, userAgent);
        return toDto(file);
    }

    /**
     * Deletes an owned file: object first, then metadata.
     *
     * <p>The order matters. Removing the row first would strand the object with no
     * record pointing at it — invisible, unbilled-for and unreclaimable. Removing
     * the object first leaves at worst a row whose object is already gone, which
     * reconciliation can detect and purge.
     *
     * <p>Idempotent: deleting an already-deleted file succeeds silently, so a
     * retried request never turns into a 404 the caller has to special-case. The
     * previously issued presigned URLs stop working because the object is gone.
     */
    public void delete(UUID fileId, String ownerEmail, String ipAddress, String userAgent) {
        User owner = requireUser(ownerEmail);
        auditService.record(FilesAuditEvents.DELETION_REQUESTED, owner.getId(), "file",
            fileId.toString(), ipAddress, userAgent);

        StoredFile file = repository.findByIdAndOwnerId(fileId, owner.getId()).orElse(null);
        if (file == null || file.getStatus() == FileStatus.DELETED) {
            return;
        }

        try {
            storageService.delete(file.getStorageKey());
        } catch (RuntimeException e) {
            // The metadata is intentionally left intact: dropping it here would
            // orphan the object for good.
            auditService.record(FilesAuditEvents.DELETION_FAILED, owner.getId(), "file",
                fileId.toString(), ipAddress, userAgent);
            log.error("File object deletion failed: fileId={}", fileId);
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR, "File deletion failed");
        }
        auditService.record(FilesAuditEvents.OBJECT_DELETED, owner.getId(), "file",
            fileId.toString(), ipAddress, userAgent);

        file.setStatus(FileStatus.DELETED);
        repository.save(file);
        auditService.record(FilesAuditEvents.DELETED, owner.getId(), "file",
            fileId.toString(), ipAddress, userAgent);
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private StoredFile requireOwnedFile(UUID fileId, UUID ownerId) {
        return repository.findByIdAndOwnerId(fileId, ownerId)
            .filter(file -> file.getStatus() != FileStatus.DELETED)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
    }

    private void validateMimeType(MultipartFile file) {
        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "File type not allowed. Supported types: images, PDF, office documents, video, audio, plain text");
        }
    }

    private void validateSize(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File must not be empty");
        }
        if (file.getSize() > filesConfig.getMaxSizeBytes()) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                "File size exceeds maximum allowed (" + (filesConfig.getMaxSizeBytes() / 1_048_576) + " MB)");
        }
    }

    private String sanitizeName(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "unnamed";
        }
        String basename = originalFilename.replaceAll("[/\\\\]", "_");
        return basename.length() > 255 ? basename.substring(0, 255) : basename;
    }

    private String extractExtension(String filename) {
        if (filename == null) return "bin";
        String ext = StringUtils.getFilenameExtension(filename);
        return (ext != null && ext.length() <= 20) ? ext.toLowerCase() : "bin";
    }

    private String generateStorageKey(FileCategory category, String extension) {
        return category.name().toLowerCase() + "/" +
            UUID.randomUUID().toString().replace("-", "") + "." + extension;
    }

    private String resolvedMimeType(MultipartFile file) {
        String ct = file.getContentType();
        return ct != null ? ct : "application/octet-stream";
    }

    private StoredFileResponseDto toDto(StoredFile stored) {
        return new StoredFileResponseDto(
            stored.getId(),
            stored.getOriginalName(),
            stored.getMimeType(),
            stored.getSize(),
            stored.getCategory().name(),
            stored.getCreatedAt()
        );
    }
}
