package com.enistere.core.infrastructure.ratelimit;

import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

/**
 * Generic in-memory rate-limiting mechanism of the API base: fixed-window
 * counters keyed by (bucket, client). The base imposes no endpoint policy —
 * each composed capability applies it to its own routes with its own limits
 * (see the auth / files throttling interceptors in their overlays).
 */
@Component
public class RateLimiter {

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    /** Returns true if the call is allowed, false if the (bucket, client) window is exhausted. */
    public boolean tryConsume(String bucket, String clientKey, int capacity, int windowSeconds) {
        String key = bucket + ":" + clientKey;
        return windows.computeIfAbsent(key, k -> new Window(capacity, windowSeconds)).tryConsume();
    }

    /** Clears all windows — intended for deterministic tests. */
    public void clear() {
        windows.clear();
    }

    private static final class Window {
        private final int capacity;
        private final long windowMillis;
        private long windowStart;
        private int count;

        Window(int capacity, int windowSeconds) {
            this.capacity = capacity;
            this.windowMillis = (long) windowSeconds * 1000;
            this.windowStart = System.currentTimeMillis();
            this.count = 0;
        }

        synchronized boolean tryConsume() {
            long now = System.currentTimeMillis();
            if (now - windowStart >= windowMillis) {
                windowStart = now;
                count = 0;
            }
            if (count < capacity) {
                count++;
                return true;
            }
            return false;
        }
    }
}
