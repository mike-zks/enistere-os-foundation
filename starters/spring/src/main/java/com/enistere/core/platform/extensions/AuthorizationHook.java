package com.enistere.core.platform.extensions;

public interface AuthorizationHook extends RuntimeExtension {
    boolean authorize(Object input);

    @Override
    default ExtensionPoint point() {
        return ExtensionPoint.AUTHORIZATION;
    }
}
