package com.enistere.core.modules.files;

import com.enistere.core.modules.files.dto.DownloadUrlResponseDto;
import com.enistere.core.modules.files.dto.FileUploadRequestDto;
import com.enistere.core.modules.files.dto.StoredFileResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
@Tag(name = "Files", description = "File upload — authenticated, metadata persisted, no internal fields in response")
public class FilesController {

    private final FileService fileService;

    public FilesController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
        summary = "Upload a file",
        description = "Validates MIME type and size, stores in MinIO/S3-compatible backend, " +
            "persists metadata in PostgreSQL. Response contains public metadata only — " +
            "no storageKey, no bucket, no signed URL.",
        security = @SecurityRequirement(name = "Bearer")
    )
    public ResponseEntity<StoredFileResponseDto> upload(
            @RequestPart("file") MultipartFile file,
            @Valid @ModelAttribute FileUploadRequestDto request,
            Authentication auth,
            HttpServletRequest httpRequest) {

        StoredFileResponseDto response = fileService.upload(
            file,
            request.getCategory(),
            request.getSubjectId(),
            auth.getName(),
            httpRequest.getRemoteAddr(),
            httpRequest.getHeader("User-Agent")
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}/download-url")
    @Operation(
        summary = "Generate a presigned download URL",
        description = "Returns a short-lived presigned URL for the caller's own file. " +
            "Anti-enumeration: returns 404 for files belonging to other users. " +
            "Response is no-store and must never be cached.",
        security = @SecurityRequirement(name = "Bearer")
    )
    public ResponseEntity<DownloadUrlResponseDto> downloadUrl(
            @PathVariable UUID id,
            Authentication auth,
            HttpServletRequest httpRequest) {

        DownloadUrlResponseDto response = fileService.getDownloadUrl(
            id,
            auth.getName(),
            httpRequest.getRemoteAddr(),
            httpRequest.getHeader("User-Agent")
        );
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(response);
    }
}
