package com.enistere.core.modules.files.dto;

import com.enistere.core.modules.files.FileCategory;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "Multipart upload request parameters")
public class FileUploadRequestDto {

    @NotNull(message = "category is required")
    @Schema(description = "File category", example = "DOCUMENT")
    private FileCategory category;

    @Size(max = 128, message = "subjectId must not exceed 128 characters")
    @Schema(description = "Optional subject reference (e.g. entity ID)", example = "usr_123")
    private String subjectId;

    public FileCategory getCategory() { return category; }
    public void setCategory(FileCategory category) { this.category = category; }

    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }
}
