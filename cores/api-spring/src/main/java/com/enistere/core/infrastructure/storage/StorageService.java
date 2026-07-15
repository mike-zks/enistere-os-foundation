package com.enistere.core.infrastructure.storage;

import java.io.IOException;
import java.io.InputStream;

public interface StorageService {
    void upload(InputStream content, String storageKey, String contentType, long size) throws IOException;
    void delete(String storageKey);
    String generatePresignedDownloadUrl(String storageKey, int ttlSeconds);
}
