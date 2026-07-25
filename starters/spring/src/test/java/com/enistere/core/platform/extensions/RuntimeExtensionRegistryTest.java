package com.enistere.core.platform.extensions;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RuntimeExtensionRegistryTest {

    private static RuntimeExtension authentication(String version) {
        return new RuntimeExtension() {
            public ExtensionPoint point() { return ExtensionPoint.AUTHENTICATION; }
            public String contractVersion() { return version; }
            public String providerId() { return "test-auth"; }
        };
    }

    @Test
    void registersOnlyExplicitVersionedExtensions() {
        RuntimeExtension extension = authentication(RuntimeExtension.CONTRACT_VERSION);
        RuntimeExtensionRegistry registry = new RuntimeExtensionRegistry(List.of(extension));

        assertEquals(List.of(RuntimeExtension.ExtensionPoint.AUTHENTICATION), registry.registeredPoints());
        assertTrue(registry.resolve(RuntimeExtension.ExtensionPoint.AUTHORIZATION, RuntimeExtension.class).isEmpty());
    }

    @Test
    void rejectsIncompatibleAndAmbiguousProviders() {
        assertThrows(IllegalArgumentException.class,
            () -> new RuntimeExtensionRegistry(List.of(authentication("api-extension/1.0.0"))));

        RuntimeExtension extension = authentication(RuntimeExtension.CONTRACT_VERSION);
        assertThrows(IllegalStateException.class,
            () -> new RuntimeExtensionRegistry(List.of(extension, extension)));
    }
}
