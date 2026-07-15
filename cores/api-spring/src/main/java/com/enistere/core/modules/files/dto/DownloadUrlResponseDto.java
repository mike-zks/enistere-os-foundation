package com.enistere.core.modules.files.dto;

import java.util.UUID;

public record DownloadUrlResponseDto(UUID fileId, String url, int expiresIn) {
}
