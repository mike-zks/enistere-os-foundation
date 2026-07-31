package com.enistere.core.modules.auth.ratelimit;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Auth-endpoint rate-limit policy. The generic mechanism lives in the base
 * ({@link RateLimiter}); this overlay only declares the limits for its routes.
 */
@Component
@ConfigurationProperties(prefix = "enistere.security.rate-limit")
public class AuthRateLimitProperties {

    /** Enabled by default; test profiles disable it (see application-test.yml). */
    private boolean enabled = true;
    private int authCapacity = 10;
    private int authRefillSeconds = 60;

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public int getAuthCapacity() { return authCapacity; }
    public void setAuthCapacity(int authCapacity) { this.authCapacity = authCapacity; }

    public int getAuthRefillSeconds() { return authRefillSeconds; }
    public void setAuthRefillSeconds(int authRefillSeconds) { this.authRefillSeconds = authRefillSeconds; }
}
