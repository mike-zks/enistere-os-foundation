package com.enistere.core.infrastructure.ratelimit;

import com.enistere.core.config.RateLimitConfig;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.concurrent.ConcurrentHashMap;

@Component
@ConditionalOnProperty(name = "enistere.security.rate-limit.enabled", havingValue = "true", matchIfMissing = true)
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimitConfig config;

    private final ConcurrentHashMap<String, RateWindow> authWindows = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RateWindow> uploadWindows = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, RateWindow> downloadUrlWindows = new ConcurrentHashMap<>();

    public RateLimitInterceptor(RateLimitConfig config) {
        this.config = config;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String ip = request.getRemoteAddr();
        String path = request.getRequestURI();
        String method = request.getMethod();

        if (isAuthPath(path)) {
            if (!authWindows.computeIfAbsent(ip, k -> new RateWindow(config.getAuthCapacity(), config.getAuthRefillSeconds())).tryConsume()) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded");
            }
        } else if (isUploadPath(path, method)) {
            if (!uploadWindows.computeIfAbsent(ip, k -> new RateWindow(config.getUploadCapacity(), config.getUploadRefillSeconds())).tryConsume()) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded");
            }
        } else if (isDownloadUrlPath(path)) {
            if (!downloadUrlWindows.computeIfAbsent(ip, k -> new RateWindow(config.getDownloadUrlCapacity(), config.getDownloadUrlRefillSeconds())).tryConsume()) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded");
            }
        }

        return true;
    }

    public void clearWindows() {
        authWindows.clear();
        uploadWindows.clear();
        downloadUrlWindows.clear();
    }

    private boolean isAuthPath(String path) {
        return "/api/v1/auth/login".equals(path) || "/api/v1/auth/refresh".equals(path);
    }

    private boolean isUploadPath(String path, String method) {
        return "/api/v1/files/upload".equals(path) && "POST".equalsIgnoreCase(method);
    }

    private boolean isDownloadUrlPath(String path) {
        return path != null && path.matches("/api/v1/files/[^/]+/download-url");
    }

    private static class RateWindow {
        final int capacity;
        final long windowMillis;
        long windowStart;
        int count;

        RateWindow(int capacity, int windowSeconds) {
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
