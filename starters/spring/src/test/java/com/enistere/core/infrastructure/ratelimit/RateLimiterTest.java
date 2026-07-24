package com.enistere.core.infrastructure.ratelimit;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RateLimiterTest {

    @Test
    void allowsUpToCapacityThenRejects() {
        RateLimiter limiter = new RateLimiter();
        for (int i = 0; i < 3; i++) {
            assertTrue(limiter.tryConsume("auth", "1.2.3.4", 3, 60));
        }
        assertFalse(limiter.tryConsume("auth", "1.2.3.4", 3, 60));
    }

    @Test
    void isolatesBucketsAndClients() {
        RateLimiter limiter = new RateLimiter();
        assertTrue(limiter.tryConsume("auth", "a", 1, 60));
        assertFalse(limiter.tryConsume("auth", "a", 1, 60));
        assertTrue(limiter.tryConsume("auth", "b", 1, 60));
        assertTrue(limiter.tryConsume("upload", "a", 1, 60));
    }
}
