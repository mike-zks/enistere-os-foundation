package com.enistere.core.platform.extensions;

public interface AuthenticationHook extends RuntimeExtension {
    Object authenticate(Object input);

    @Override
    default ExtensionPoint point() {
        return ExtensionPoint.AUTHENTICATION;
    }
}
