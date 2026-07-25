package com.enistere.core.infrastructure.ratelimit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Registers the auth rate-limit interceptor on the auth endpoints. Each capability
 * contributes its own WebMvcConfigurer (all are applied), so the base owns no path.
 */
@Configuration
public class AuthRateLimitWebMvcConfig implements WebMvcConfigurer {

    @Autowired(required = false)
    private AuthRateLimitInterceptor interceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        if (interceptor != null) {
            registry.addInterceptor(interceptor)
                .addPathPatterns("/api/v1/auth/login", "/api/v1/auth/refresh");
        }
    }
}
