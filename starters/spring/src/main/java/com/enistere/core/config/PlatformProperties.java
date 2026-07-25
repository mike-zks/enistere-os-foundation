package com.enistere.core.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/** Typed and startup-validated properties owned by the Platform Baseline. */
@Validated
@ConfigurationProperties(prefix = "enistere.runtime")
public record PlatformProperties(
    @NotBlank String serviceName,
    @Min(1) @Max(300) int shutdownTimeoutSeconds
) {
}
