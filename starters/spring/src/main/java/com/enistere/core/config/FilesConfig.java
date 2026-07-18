package com.enistere.core.config;

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

    public long getMaxSizeBytes() { return maxSizeBytes; }
    public void setMaxSizeBytes(long maxSizeBytes) { this.maxSizeBytes = maxSizeBytes; }

    public int getPresignedUrlTtlSeconds() { return presignedUrlTtlSeconds; }
    public void setPresignedUrlTtlSeconds(int presignedUrlTtlSeconds) { this.presignedUrlTtlSeconds = presignedUrlTtlSeconds; }
}
