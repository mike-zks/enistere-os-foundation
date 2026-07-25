package com.enistere.core.platform.extensions;

public interface EventHook extends RuntimeExtension {
    void publish(Object event);

    @Override
    default ExtensionPoint point() {
        return ExtensionPoint.EVENTS;
    }
}
