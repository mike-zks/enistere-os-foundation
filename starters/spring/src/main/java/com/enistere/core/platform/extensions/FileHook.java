package com.enistere.core.platform.extensions;

public interface FileHook extends RuntimeExtension {
    Object execute(Object input);

    @Override
    default ExtensionPoint point() {
        return ExtensionPoint.FILES;
    }
}
