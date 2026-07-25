package com.enistere.core.infrastructure.ratelimit;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Applies the base {@link RateLimiter} to the auth endpoints. Only created when
 * rate limiting is enabled (default on; disabled in tests).
 */
@Component
@ConditionalOnProperty(name = "enistere.security.rate-limit.enabled", havingValue = "true", matchIfMissing = true)
public class AuthRateLimitInterceptor implements HandlerInterceptor {

    private final RateLimiter rateLimiter;
    private final AuthRateLimitProperties props;

    public AuthRateLimitInterceptor(RateLimiter rateLimiter, AuthRateLimitProperties props) {
        this.rateLimiter = rateLimiter;
        this.props = props;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!rateLimiter.tryConsume("auth", request.getRemoteAddr(),
                props.getAuthCapacity(), props.getAuthRefillSeconds())) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded");
        }
        return true;
    }
}
