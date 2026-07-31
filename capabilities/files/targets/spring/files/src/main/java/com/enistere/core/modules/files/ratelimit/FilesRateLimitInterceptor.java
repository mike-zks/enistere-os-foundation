package com.enistere.core.modules.files.ratelimit;

import com.enistere.core.infrastructure.ratelimit.RateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Applies the base {@link RateLimiter} to the files endpoints (upload and
 * download-url), each with its own bucket. Only created when rate limiting is
 * enabled (default on; disabled in tests).
 */
@Component
@ConditionalOnProperty(name = "enistere.security.rate-limit.enabled", havingValue = "true", matchIfMissing = true)
public class FilesRateLimitInterceptor implements HandlerInterceptor {

    private final RateLimiter rateLimiter;
    private final FilesRateLimitProperties props;

    public FilesRateLimitInterceptor(RateLimiter rateLimiter, FilesRateLimitProperties props) {
        this.rateLimiter = rateLimiter;
        this.props = props;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String path = request.getRequestURI();
        String client = request.getRemoteAddr();
        boolean allowed = isUpload(path, request.getMethod())
            ? rateLimiter.tryConsume("files-upload", client, props.getUploadCapacity(), props.getUploadRefillSeconds())
            : rateLimiter.tryConsume("files-download-url", client, props.getDownloadUrlCapacity(), props.getDownloadUrlRefillSeconds());
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded");
        }
        return true;
    }

    private boolean isUpload(String path, String method) {
        return "/api/v1/files/upload".equals(path) && "POST".equalsIgnoreCase(method);
    }
}
