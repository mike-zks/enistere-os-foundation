package com.enistere.core.platform.extensions;

import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Registre strict des adapters de capabilities : version exacte et un provider
 * actif au maximum par point d'extension.
 */
@Component
public class RuntimeExtensionRegistry {

    private final Map<RuntimeExtension.ExtensionPoint, RuntimeExtension> extensions =
        new EnumMap<>(RuntimeExtension.ExtensionPoint.class);

    public RuntimeExtensionRegistry(List<RuntimeExtension> discovered) {
        discovered.forEach(this::register);
    }

    public void register(RuntimeExtension extension) {
        if (!RuntimeExtension.CONTRACT_VERSION.equals(extension.contractVersion())) {
            throw new IllegalArgumentException(
                "Unsupported " + extension.point() + " extension contract: " + extension.contractVersion());
        }
        if (extensions.putIfAbsent(extension.point(), extension) != null) {
            throw new IllegalStateException("Extension point already registered: " + extension.point());
        }
    }

    public <T extends RuntimeExtension> Optional<T> resolve(
            RuntimeExtension.ExtensionPoint point, Class<T> expectedType) {
        return Optional.ofNullable(extensions.get(point)).map(expectedType::cast);
    }

    public List<RuntimeExtension.ExtensionPoint> registeredPoints() {
        return List.copyOf(extensions.keySet());
    }
}
