package com.enistere.core.modules.files;

import com.enistere.core.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "stored_files")
public class StoredFile extends BaseEntity {

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "storage_key", nullable = false, length = 512, unique = true)
    private String storageKey;

    @Column(nullable = false, length = 255)
    private String bucket;

    @Column(name = "mime_type", nullable = false, length = 127)
    private String mimeType;

    @Column(nullable = false, length = 20)
    private String extension;

    @Column(nullable = false)
    private Long size;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private FileCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private FileStatus status;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "subject_id", length = 128)
    private String subjectId;

    public String getOriginalName() { return originalName; }
    public void setOriginalName(String originalName) { this.originalName = originalName; }

    public String getStorageKey() { return storageKey; }
    public void setStorageKey(String storageKey) { this.storageKey = storageKey; }

    public String getBucket() { return bucket; }
    public void setBucket(String bucket) { this.bucket = bucket; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public String getExtension() { return extension; }
    public void setExtension(String extension) { this.extension = extension; }

    public Long getSize() { return size; }
    public void setSize(Long size) { this.size = size; }

    public FileCategory getCategory() { return category; }
    public void setCategory(FileCategory category) { this.category = category; }

    public FileStatus getStatus() { return status; }
    public void setStatus(FileStatus status) { this.status = status; }

    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }

    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }
}
