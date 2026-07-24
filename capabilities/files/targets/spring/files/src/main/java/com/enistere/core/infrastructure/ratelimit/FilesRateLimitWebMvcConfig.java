package com.enistere.core.infrastructure.ratelimit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Registers the files rate-limit interceptor on the files endpoints. Each capability
 * contributes its own WebMvcConfigurer (all are applied), so the base owns no path.
 */
@Configuration
public class FilesRateLimitWebMvcConfig implements WebMvcConfigurer {

    @Autowired(required = false)
    private FilesRateLimitInterceptor interceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        if (interceptor != null) {
            registry.addInterceptor(interceptor)
                .addPathPatterns("/api/v1/files/upload", "/api/v1/files/*/download-url");
        }
    }
}
