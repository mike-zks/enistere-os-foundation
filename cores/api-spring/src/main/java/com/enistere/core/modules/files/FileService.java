package com.enistere.core.modules.files;

import com.enistere.core.config.FilesConfig;
import com.enistere.core.infrastructure.storage.StorageService;
import com.enistere.core.modules.files.dto.StoredFileResponseDto;
import com.enistere.core.modules.users.User;
import com.enistere.core.modules.users.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
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

    public FileService(StoredFileRepository repository, StorageService storageService,
                       UserRepository userRepository, FilesConfig filesConfig) {
        this.repository = repository;
        this.storageService = storageService;
        this.userRepository = userRepository;
        this.filesConfig = filesConfig;
    }

    public StoredFileResponseDto upload(MultipartFile file, FileCategory category,
                                        String subjectId, String ownerEmail) {
        validateMimeType(file);
        validateSize(file);

        User owner = userRepository.findByEmail(ownerEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        String sanitizedName = sanitizeName(file.getOriginalFilename());
        String extension = extractExtension(file.getOriginalFilename());
        String storageKey = generateStorageKey(category, extension);

        log.info("File upload: category={} size={} mimeType={} key={}",
            category, file.getSize(), file.getContentType(), storageKey);

        try {
            storageService.upload(file.getInputStream(), storageKey, file.getContentType(), file.getSize());
        } catch (IOException e) {
            log.error("Storage upload failed: key={}", storageKey);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Storage failure");
        }

        StoredFile stored = new StoredFile();
        stored.setOriginalName(sanitizedName);
        stored.setStorageKey(storageKey);
        stored.setBucket(filesConfig.getBucket());
        stored.setMimeType(resolvedMimeType(file));
        stored.setExtension(extension);
        stored.setSize(file.getSize());
        stored.setCategory(category);
        stored.setStatus(FileStatus.UPLOADED);
        stored.setOwnerId(owner.getId());
        stored.setSubjectId(subjectId);
        stored = repository.save(stored);

        return toDto(stored);
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
