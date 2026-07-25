package com.enistere.core.platform.extensions;

/**
 * Contrat neutre entre le Platform Baseline et les capabilities. Aucun provider
 * métier n'est activé implicitement par le starter.
 */
public interface RuntimeExtension {
    String CONTRACT_VERSION = "api-extension/2.0.0";

    ExtensionPoint point();

    String contractVersion();

    String providerId();

    enum ExtensionPoint {
        AUTHENTICATION,
        AUTHORIZATION,
        FILES,
        EVENTS
    }
}
