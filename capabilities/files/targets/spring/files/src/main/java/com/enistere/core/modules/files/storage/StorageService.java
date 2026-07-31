package com.enistere.core.modules.files.storage;

import java.io.IOException;
import java.io.InputStream;

public interface StorageService {
    void upload(InputStream content, String storageKey, String contentType, long size) throws IOException;
    void delete(String storageKey);
    String generatePresignedDownloadUrl(String storageKey, int ttlSeconds);

    /**
     * Whether the object still exists in the bucket. Used before releasing a
     * quarantine: restoring a record whose object has vanished would advertise a
     * file that cannot be downloaded.
     */
    boolean objectExists(String storageKey);
}
