package com.enistere.core.platform.observability;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Métriques bornées : méthode, route normalisée et classe de statut seulement.
 * Le traceId n'est jamais un label métrique à forte cardinalité.
 */
@Component
public class MicrometerTelemetryAdapter implements TelemetryPort {

    private final MeterRegistry registry;

    public MicrometerTelemetryAdapter(MeterRegistry registry) {
        this.registry = registry;
    }

    @Override
    public void recordRequest(String method, String route, int statusCode, long durationNanos, String traceId) {
        registry.timer(
                "enistere.http.server.requests",
                "method", method,
                "route", route,
                "status", statusCode / 100 + "xx")
            .record(Duration.ofNanos(durationNanos));
        if (statusCode >= 500) {
            registry.counter("enistere.http.server.errors", "route", route).increment();
        }
    }
}
