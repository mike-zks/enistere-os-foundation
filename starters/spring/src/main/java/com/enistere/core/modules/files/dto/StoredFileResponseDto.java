package com.enistere.core.modules.files.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.UUID;

@Schema(description = "Public file metadata — never exposes storageKey, bucket, signed URL or internal owner details")
public class StoredFileResponseDto {

    @Schema(description = "File UUID")
    private UUID id;

    @Schema(description = "Display name (sanitized, not used for storage)", example = "report.pdf")
    private String originalName;

    @Schema(description = "MIME type", example = "application/pdf")
    private String contentType;

    @Schema(description = "File size in bytes", example = "204800")
    private Long size;

    @Schema(description = "File category", example = "DOCUMENT")
    private String category;

    @Schema(description = "Upload timestamp (ISO-8601)")
    private Instant createdAt;

    public StoredFileResponseDto() {}

    public StoredFileResponseDto(UUID id, String originalName, String contentType,
                                  Long size, String category, Instant createdAt) {
        this.id = id;
        this.originalName = originalName;
        this.contentType = contentType;
        this.size = size;
        this.category = category;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public String getOriginalName() { return originalName; }
    public String getContentType() { return contentType; }
    public Long getSize() { return size; }
    public String getCategory() { return category; }
    public Instant getCreatedAt() { return createdAt; }
}
