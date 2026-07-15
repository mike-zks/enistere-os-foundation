package com.enistere.core.config;

import com.enistere.core.infrastructure.ratelimit.RateLimitInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired(required = false)
    private RateLimitInterceptor rateLimitInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        if (rateLimitInterceptor != null) {
            registry.addInterceptor(rateLimitInterceptor)
                .addPathPatterns(
                    "/api/v1/auth/login",
                    "/api/v1/auth/refresh",
                    "/api/v1/files/upload",
                    "/api/v1/files/*/download-url"
                );
        }
    }
}
