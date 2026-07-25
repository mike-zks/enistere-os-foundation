package com.enistere.core.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final CorsConfig cors;

    public WebMvcConfig(CorsConfig cors) {
        this.cors = cors;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOrigins(cors.getAllowedOriginsList().toArray(String[]::new))
            .allowedMethods("GET", "POST", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("Authorization", "Content-Type", "X-Request-Id", "traceparent")
            .exposedHeaders("X-Request-Id", "traceparent")
            .allowCredentials(true)
            .maxAge(3600);
    }
}
