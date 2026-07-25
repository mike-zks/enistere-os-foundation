package com.enistere.core.platform.observability;

/**
 * Extension explicite pour brancher un SDK/exporter OpenTelemetry. Le backend
 * reste une primitive de déploiement et n'est pas imposé par le starter.
 */
public interface OpenTelemetryHook {
    String CONTRACT_VERSION = "telemetry/2.0.0";

    String contractVersion();

    void configure();
}
