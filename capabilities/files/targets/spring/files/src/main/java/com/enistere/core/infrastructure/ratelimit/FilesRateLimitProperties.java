package com.enistere.core.infrastructure.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Files-endpoint rate-limit policy. The generic mechanism lives in the base
 * ({@link RateLimiter}); this overlay only declares the limits for its routes.
 */
@Component
@ConfigurationProperties(prefix = "enistere.security.rate-limit")
public class FilesRateLimitProperties {

    /** Enabled by default; test profiles disable it (see application-test.yml). */
    private boolean enabled = true;
    private int uploadCapacity = 20;
    private int uploadRefillSeconds = 60;
    private int downloadUrlCapacity = 30;
    private int downloadUrlRefillSeconds = 60;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public int getUploadCapacity() { return uploadCapacity; }
    public void setUploadCapacity(int uploadCapacity) { this.uploadCapacity = uploadCapacity; }

    public int getUploadRefillSeconds() { return uploadRefillSeconds; }
    public void setUploadRefillSeconds(int uploadRefillSeconds) { this.uploadRefillSeconds = uploadRefillSeconds; }

    public int getDownloadUrlCapacity() { return downloadUrlCapacity; }
    public void setDownloadUrlCapacity(int downloadUrlCapacity) { this.downloadUrlCapacity = downloadUrlCapacity; }

    public int getDownloadUrlRefillSeconds() { return downloadUrlRefillSeconds; }
    public void setDownloadUrlRefillSeconds(int downloadUrlRefillSeconds) { this.downloadUrlRefillSeconds = downloadUrlRefillSeconds; }
}
