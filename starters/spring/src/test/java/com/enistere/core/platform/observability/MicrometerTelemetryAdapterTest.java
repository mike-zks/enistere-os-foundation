package com.enistere.core.platform.observability;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MicrometerTelemetryAdapterTest {

    @Test
    void recordsBoundedRequestAndErrorMetrics() {
        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        MicrometerTelemetryAdapter adapter = new MicrometerTelemetryAdapter(registry);

        adapter.recordRequest("GET", "/health", 503, 1_000_000, "a".repeat(32));

        assertEquals(1,
            registry.get("enistere.http.server.requests").timer().count());
        assertEquals(1,
            registry.get("enistere.http.server.errors").counter().count());
    }
}
