package com.enistere.core.modules.files;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "enistere.files")
@Validated
public class FilesConfig {

    @NotBlank
    private String endpoint;

    @NotBlank
    private String bucket;

    private String region = "us-east-1";

    @NotBlank
    private String accessKey;

    @NotBlank
    private String secretKey;

    @Positive
    private long maxSizeBytes = 10_485_760L;

    @Positive
    private int presignedUrlTtlSeconds = 300;

    /** Per-owner cap on active files. {@code 0} means unlimited. */
    private int ownerMaxActiveFiles = 0;

    /** Per-owner cap on the total bytes of active files. {@code 0} means unlimited. */
    private long ownerMaxTotalBytes = 0L;

    /** How long a deleted record is kept before maintenance may purge it. */
    private long purgeRetentionSeconds = 604_800L;

    /** Object-store budgets. Unbounded waits turn a storage incident into an outage. */
    private long storageConnectTimeoutSeconds = 5L;
    private long storageWriteTimeoutSeconds = 60L;
    private long storageReadTimeoutSeconds = 30L;

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public String getBucket() { return bucket; }
    public void setBucket(String bucket) { this.bucket = bucket; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public String getAccessKey() { return accessKey; }
    public void setAccessKey(String accessKey) { this.accessKey = accessKey; }

    public String getSecretKey() { return secretKey; }
    public void setSecretKey(String secretKey) { this.secretKey = secretKey; }

    public int getOwnerMaxActiveFiles() { return ownerMaxActiveFiles; }
    public void setOwnerMaxActiveFiles(int ownerMaxActiveFiles) { this.ownerMaxActiveFiles = ownerMaxActiveFiles; }

    public long getOwnerMaxTotalBytes() { return ownerMaxTotalBytes; }
    public void setOwnerMaxTotalBytes(long ownerMaxTotalBytes) { this.ownerMaxTotalBytes = ownerMaxTotalBytes; }

    public long getStorageConnectTimeoutSeconds() { return storageConnectTimeoutSeconds; }
    public void setStorageConnectTimeoutSeconds(long v) { this.storageConnectTimeoutSeconds = v; }

    public long getStorageWriteTimeoutSeconds() { return storageWriteTimeoutSeconds; }
    public void setStorageWriteTimeoutSeconds(long v) { this.storageWriteTimeoutSeconds = v; }

    public long getStorageReadTimeoutSeconds() { return storageReadTimeoutSeconds; }
    public void setStorageReadTimeoutSeconds(long v) { this.storageReadTimeoutSeconds = v; }

    public long getPurgeRetentionSeconds() { return purgeRetentionSeconds; }
    public void setPurgeRetentionSeconds(long purgeRetentionSeconds) { this.purgeRetentionSeconds = purgeRetentionSeconds; }

    public long getMaxSizeBytes() { return maxSizeBytes; }
    public void setMaxSizeBytes(long maxSizeBytes) { this.maxSizeBytes = maxSizeBytes; }

    public int getPresignedUrlTtlSeconds() { return presignedUrlTtlSeconds; }
    public void setPresignedUrlTtlSeconds(int presignedUrlTtlSeconds) { this.presignedUrlTtlSeconds = presignedUrlTtlSeconds; }
}
