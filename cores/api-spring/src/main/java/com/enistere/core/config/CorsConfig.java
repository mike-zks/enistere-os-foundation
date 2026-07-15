package com.enistere.core.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Arrays;
import java.util.List;

@ConfigurationProperties(prefix = "enistere.security.cors")
public class CorsConfig {

    private String allowedOrigins =
        "http://localhost:3000,http://localhost:4200,http://localhost:8080,http://localhost:8081,http://localhost:19006";

    public String getAllowedOrigins() { return allowedOrigins; }

    public void setAllowedOrigins(String allowedOrigins) { this.allowedOrigins = allowedOrigins; }

    public List<String> getAllowedOriginsList() {
        return Arrays.stream(allowedOrigins.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();
    }
}
