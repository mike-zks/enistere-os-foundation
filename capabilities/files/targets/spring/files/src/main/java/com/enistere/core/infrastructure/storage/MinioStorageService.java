package com.enistere.core.infrastructure.storage;

import com.enistere.core.config.FilesConfig;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.errors.ErrorResponseException;
import io.minio.http.Method;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.util.concurrent.TimeUnit;

@Service
@Profile("!test")
public class MinioStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(MinioStorageService.class);

    private final MinioClient minioClient;
    private final FilesConfig filesConfig;

    public MinioStorageService(MinioClient minioClient, FilesConfig filesConfig) {
        this.minioClient = minioClient;
        this.filesConfig = filesConfig;
    }

    @Override
    public void upload(InputStream content, String storageKey, String contentType, long size) throws IOException {
        try {
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(filesConfig.getBucket())
                    .object(storageKey)
                    .stream(content, size, -1)
                    .contentType(contentType)
                    .build()
            );
            log.info("Stored object: size={} contentType={}", size, contentType);
        } catch (Exception e) {
            log.error("Storage upload failed: size={} contentType={}", size, contentType);
            throw new IOException("Storage upload failed", e);
        }
    }

    @Override
    public void delete(String storageKey) {
        try {
            minioClient.removeObject(
                RemoveObjectArgs.builder()
                    .bucket(filesConfig.getBucket())
                    .object(storageKey)
                    .build()
            );
            log.info("Deleted object");
        } catch (Exception e) {
            log.error("Storage delete failed");
            throw new RuntimeException("Storage delete failed", e);
        }
    }

    @Override
    public boolean objectExists(String storageKey) {
        try {
            minioClient.statObject(
                StatObjectArgs.builder()
                    .bucket(filesConfig.getBucket())
                    .object(storageKey)
                    .build()
            );
            return true;
        } catch (ErrorResponseException e) {
            // A genuine "not found" from the store: expected, not an incident.
            log.debug("Object absent from bucket");
            return false;
        } catch (Exception e) {
            // Unreachable or refused. Still false — the caller only releases a
            // quarantine on a positive answer — but logged, because a broken
            // store must not be indistinguishable from a missing object.
            log.warn("Object presence check failed; treating as absent: {}", e.getClass().getSimpleName());
            return false;
        }
    }

    @Override
    public String generatePresignedDownloadUrl(String storageKey, int ttlSeconds) {
        try {
            return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(filesConfig.getBucket())
                    .object(storageKey)
                    .expiry(ttlSeconds, TimeUnit.SECONDS)
                    .build()
            );
        } catch (Exception e) {
            log.error("Presigned URL generation failed");
            throw new RuntimeException("Presigned URL generation failed", e);
        }
    }
}
