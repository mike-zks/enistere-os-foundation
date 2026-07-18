package com.enistere.core.config;

import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "enistere.security.rate-limit")
@Validated
public class RateLimitConfig {

    private boolean enabled = true;

    @Positive
    private int authCapacity = 10;

    @Positive
    private int authRefillSeconds = 60;

    @Positive
    private int uploadCapacity = 20;

    @Positive
    private int uploadRefillSeconds = 60;

    @Positive
    private int downloadUrlCapacity = 30;

    @Positive
    private int downloadUrlRefillSeconds = 60;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public int getAuthCapacity() { return authCapacity; }
    public void setAuthCapacity(int authCapacity) { this.authCapacity = authCapacity; }

    public int getAuthRefillSeconds() { return authRefillSeconds; }
    public void setAuthRefillSeconds(int authRefillSeconds) { this.authRefillSeconds = authRefillSeconds; }

    public int getUploadCapacity() { return uploadCapacity; }
    public void setUploadCapacity(int uploadCapacity) { this.uploadCapacity = uploadCapacity; }

    public int getUploadRefillSeconds() { return uploadRefillSeconds; }
    public void setUploadRefillSeconds(int uploadRefillSeconds) { this.uploadRefillSeconds = uploadRefillSeconds; }

    public int getDownloadUrlCapacity() { return downloadUrlCapacity; }
    public void setDownloadUrlCapacity(int downloadUrlCapacity) { this.downloadUrlCapacity = downloadUrlCapacity; }

    public int getDownloadUrlRefillSeconds() { return downloadUrlRefillSeconds; }
    public void setDownloadUrlRefillSeconds(int downloadUrlRefillSeconds) { this.downloadUrlRefillSeconds = downloadUrlRefillSeconds; }
}
