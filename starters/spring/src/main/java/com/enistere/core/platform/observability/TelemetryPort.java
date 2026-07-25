package com.enistere.core.platform.observability;

/**
 * Port d'instrumentation stable. Un adapter OpenTelemetry peut remplacer ou
 * compléter l'implémentation Micrometer sans modifier les contrôleurs.
 */
public interface TelemetryPort {
    String CONTRACT_VERSION = "telemetry/2.0.0";

    void recordRequest(String method, String route, int statusCode, long durationNanos, String traceId);
}
