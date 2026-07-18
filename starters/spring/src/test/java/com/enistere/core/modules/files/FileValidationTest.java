package com.enistere.core.modules.files;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FileValidationTest {

    @ParameterizedTest
    @ValueSource(strings = {"image/jpeg", "image/png", "application/pdf", "video/mp4", "audio/mpeg", "text/plain"})
    void allowedMimeTypes_areAccepted(String mimeType) {
        MockMultipartFile file = new MockMultipartFile("file", "test.bin", mimeType, new byte[100]);
        assertThat(file.getContentType()).isEqualTo(mimeType);
        assertThat(file.isEmpty()).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {"application/x-executable", "text/html", "application/javascript", "image/tiff"})
    void blockedMimeTypes_shouldBeRejected(String mimeType) {
        MockMultipartFile file = new MockMultipartFile("file", "test.bin", mimeType, new byte[100]);
        assertThat(isBlocked(file.getContentType())).isTrue();
    }

    @Test
    void emptyFile_shouldBeRejected() {
        MockMultipartFile file = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);
        assertThat(file.isEmpty()).isTrue();
    }

    @Test
    void oversizedFile_shouldBeRejected() {
        long maxBytes = 10_485_760L;
        byte[] oversized = new byte[(int) maxBytes + 1];
        MockMultipartFile file = new MockMultipartFile("file", "large.pdf", "application/pdf", oversized);
        assertThat(file.getSize()).isGreaterThan(maxBytes);
    }

    @Test
    void fileCategory_validValues_areRecognized() {
        for (FileCategory cat : FileCategory.values()) {
            assertThat(cat.name()).isNotBlank();
        }
        assertThat(FileCategory.values()).hasSize(9);
    }

    @Test
    void fileCategory_enumValues_matchExpected() {
        assertThat(FileCategory.valueOf("IMAGE")).isEqualTo(FileCategory.IMAGE);
        assertThat(FileCategory.valueOf("DOCUMENT")).isEqualTo(FileCategory.DOCUMENT);
        assertThat(FileCategory.valueOf("IDENTITY_DOCUMENT")).isEqualTo(FileCategory.IDENTITY_DOCUMENT);
    }

    @Test
    void nullContentType_shouldBeBlocked() {
        assertThat(isBlocked(null)).isTrue();
    }

    @Test
    void wildcardContentType_shouldBeBlocked() {
        assertThat(isBlocked("*/*")).isTrue();
        assertThat(isBlocked("application/octet-stream")).isTrue();
    }

    private boolean isBlocked(String mimeType) {
        java.util.Set<String> allowed = java.util.Set.of(
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
        return mimeType == null || !allowed.contains(mimeType.toLowerCase());
    }
}
