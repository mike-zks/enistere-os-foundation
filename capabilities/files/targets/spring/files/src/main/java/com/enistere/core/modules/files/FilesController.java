package com.enistere.core.modules.files;

import com.enistere.core.modules.files.dto.DownloadUrlResponseDto;
import com.enistere.core.modules.files.dto.FileListResponseDto;
import com.enistere.core.modules.files.dto.FileUploadRequestDto;
import com.enistere.core.modules.files.dto.StoredFileResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
@Validated
@Tag(name = "Files", description = "Owned file lifecycle — authenticated, permission-guarded, no internal fields in response")
public class FilesController {

    private final FileService fileService;

    public FilesController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("@rbacAuthorization.hasPermission(authentication, 'files.upload')")
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
    @PreAuthorize("@rbacAuthorization.hasPermission(authentication, 'files.download')")
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

    @GetMapping
    @PreAuthorize("@rbacAuthorization.hasPermission(authentication, 'files.read')")
    @Operation(
        summary = "List owned files",
        description = "Paginated page of the caller's own files, newest first, excluding deleted "
            + "entries. Public metadata only — no storageKey, no bucket, no signed URL.",
        security = @SecurityRequirement(name = "Bearer")
    )
    public ResponseEntity<FileListResponseDto> list(
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit,
            @RequestParam(defaultValue = "0") @Min(0) int offset,
            Authentication auth) {

        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(fileService.listOwnedFiles(auth.getName(), limit, offset));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@rbacAuthorization.hasPermission(authentication, 'files.read')")
    @Operation(
        summary = "Read owned file metadata",
        description = "Public metadata of one owned file. Anti-enumeration: a file owned by "
            + "another user and a file that does not exist both return 404.",
        security = @SecurityRequirement(name = "Bearer")
    )
    public ResponseEntity<StoredFileResponseDto> metadata(
            @PathVariable UUID id,
            Authentication auth,
            HttpServletRequest httpRequest) {

        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(fileService.getMetadata(
                id,
                auth.getName(),
                httpRequest.getRemoteAddr(),
                httpRequest.getHeader("User-Agent")
            ));
    }

    @DeleteMapping("/{id}")
    @Operation(
        summary = "Delete an owned file",
        description = "Removes the stored object then its metadata, which invalidates any "
            + "previously issued download URL. Idempotent: deleting an already-deleted or "
            + "unknown file returns 204, never 404.",
        security = @SecurityRequirement(name = "Bearer")
    )
    @PreAuthorize("@rbacAuthorization.hasPermission(authentication, 'files.delete')")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id,
            Authentication auth,
            HttpServletRequest httpRequest) {

        fileService.delete(
            id,
            auth.getName(),
            httpRequest.getRemoteAddr(),
            httpRequest.getHeader("User-Agent")
        );
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @PostMapping("/{id}/quarantine")
    @PreAuthorize("@rbacAuthorization.hasPermission(authentication, 'files.quarantine')")
    @Operation(
        summary = "Quarantine a file (administrative)",
        description = "Blocks download and signed-URL issuance until an explicit restore. "
            + "Requires files.quarantine and, unlike the owner-facing endpoints, no ownership. "
            + "Idempotent; a file that cannot transition from its current status returns 409 "
            + "without disclosing that status.",
        security = @SecurityRequirement(name = "Bearer")
    )
    public ResponseEntity<Void> quarantine(
            @PathVariable UUID id,
            Authentication auth,
            HttpServletRequest httpRequest) {

        fileService.quarantine(
            id,
            auth.getName(),
            httpRequest.getRemoteAddr(),
            httpRequest.getHeader("User-Agent")
        );
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).build();
    }

    @PostMapping("/{id}/restore")
    @PreAuthorize("@rbacAuthorization.hasPermission(authentication, 'files.restore')")
    @Operation(
        summary = "Release a quarantine (administrative)",
        description = "Restores normal access, and only while the stored object is still "
            + "present. Requires files.restore and no ownership. No scan is re-run: the "
            + "decision is manual.",
        security = @SecurityRequirement(name = "Bearer")
    )
    public ResponseEntity<Void> restore(
            @PathVariable UUID id,
            Authentication auth,
            HttpServletRequest httpRequest) {

        fileService.restore(
            id,
            auth.getName(),
            httpRequest.getRemoteAddr(),
            httpRequest.getHeader("User-Agent")
        );
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).build();
    }
}
