package com.enistere.core.common.web;

import com.enistere.core.platform.observability.TelemetryPort;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
class RequestTelemetryFilterTest {

    @Test
    void propagatesTraceContextAndRecordsTheRequest() throws Exception {
        RecordingTelemetry telemetry = new RecordingTelemetry();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/health");
        request.addHeader("traceparent",
            "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01");
        MockHttpServletResponse response = new MockHttpServletResponse();

        new RequestTelemetryFilter(telemetry).doFilter(request, response, new MockFilterChain());

        assertTrue(response.getHeader("traceparent").matches(
            "^00-4bf92f3577b34da6a3ce929d0e0e4736-[0-9a-f]{16}-01$"));
        assertTrue(telemetry.recorded);
        assertTrue(telemetry.traceId.equals("4bf92f3577b34da6a3ce929d0e0e4736"));
    }

    @Test
    void neverPropagatesATelemetryFailureToTheRequest() {
        TelemetryPort failing = (method, route, statusCode, durationNanos, traceId) -> {
            throw new IllegalStateException("collector unavailable");
        };

        assertDoesNotThrow(() -> new RequestTelemetryFilter(failing).doFilter(
            new MockHttpServletRequest("GET", "/health"),
            new MockHttpServletResponse(),
            new MockFilterChain()));
    }

    private static final class RecordingTelemetry implements TelemetryPort {
        private boolean recorded;
        private String traceId;

        @Override
        public void recordRequest(
                String method, String route, int statusCode, long durationNanos, String traceId) {
            this.recorded = method.equals("GET") && route.equals("unmatched")
                && statusCode == 200 && durationNanos >= 0;
            this.traceId = traceId;
        }
    }
}
