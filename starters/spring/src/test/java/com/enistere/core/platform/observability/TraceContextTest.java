package com.enistere.core.platform.observability;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TraceContextTest {

    @Test
    void continuesValidW3CContextAndRegeneratesInvalidContext() {
        TraceContext continued = TraceContext.continueOrCreate(
            "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01");
        assertEquals("4bf92f3577b34da6a3ce929d0e0e4736", continued.traceId());
        assertTrue(continued.traceparent().matches(
            "^00-4bf92f3577b34da6a3ce929d0e0e4736-[0-9a-f]{16}-01$"));

        TraceContext regenerated = TraceContext.continueOrCreate(
            "00-00000000000000000000000000000000-0000000000000000-01");
        assertTrue(regenerated.traceId().matches("^[0-9a-f]{32}$"));
        assertNotEquals("0".repeat(32), regenerated.traceId());
    }
}
