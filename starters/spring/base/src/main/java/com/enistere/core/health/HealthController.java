package com.enistere.core.health;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Health probes (public) — liveness/readiness split, parity with the NestJS
 * {@code HealthController} ({@code /health}, {@code /health/live},
 * {@code /health/ready}) required by the Platform Contract (ADR-047).
 *
 * <ul>
 *   <li>{@code live} depends on no external service (the process answers);</li>
 *   <li>{@code ready} reports hard dependencies. The Spring base has no hard
 *       external dependency, so it reports ready with an empty {@code checks} map;
 *       a capability that adds a datastore extends readiness with its own check.</li>
 * </ul>
 *
 * <p>No sensitive detail (host/port/credentials/internal version) is exposed.
 * These endpoints complement the Actuator health group; they are the canonical,
 * cross-runtime observable contract.
 */
@RestController
@RequestMapping("/health")
@Tag(name = "Health")
public class HealthController {

    @GetMapping
    @Operation(operationId = "health_get", summary = "General application status.")
    public Map<String, Object> health() {
        return Map.of("status", "ok", "service", "api-spring-core", "timestamp", Instant.now().toString());
    }

    @GetMapping("/live")
    @Operation(operationId = "health_live", summary = "Liveness: the process answers (no external dependency).")
    public Map<String, String> liveness() {
        return Map.of("status", "live");
    }

    @GetMapping("/ready")
    @Operation(operationId = "health_ready", summary = "Readiness: hard dependencies available.")
    public Map<String, Object> readiness() {
        return Map.of("status", "ready", "checks", Map.of());
    }
}
