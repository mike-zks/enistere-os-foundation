package com.enistere.core.modules.files.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * One page of owned file metadata (ADR-070). {@code nextOffset} is {@code null}
 * on the last page, so a client never has to compute whether more results exist.
 */
@Schema(description = "Paginated page of owned files — public metadata only")
public class FileListResponseDto {

    @Schema(description = "Files owned by the caller, newest first")
    private List<StoredFileResponseDto> items;

    @Schema(description = "Offset of the next page, or null on the last page", example = "20")
    private Integer nextOffset;

    @Schema(description = "Total number of non-deleted files owned by the caller", example = "42")
    private long total;

    public FileListResponseDto() {}

    public FileListResponseDto(List<StoredFileResponseDto> items, Integer nextOffset, long total) {
        this.items = items;
        this.nextOffset = nextOffset;
        this.total = total;
    }

    public List<StoredFileResponseDto> getItems() { return items; }
    public Integer getNextOffset() { return nextOffset; }
    public long getTotal() { return total; }
}
