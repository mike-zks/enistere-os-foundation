package com.enistere.core.platform.lifecycle;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RuntimeLifecycleTest {

    @Test
    void transitionsAndClosesHooksInReverseRegistrationOrderOnlyOnce() {
        RuntimeLifecycle lifecycle = new RuntimeLifecycle();
        List<String> calls = new ArrayList<>();
        lifecycle.registerShutdownHook(() -> calls.add("first"));
        lifecycle.registerShutdownHook(() -> calls.add("second"));

        lifecycle.ready();
        assertEquals(RuntimeLifecycle.State.READY, lifecycle.state());
        lifecycle.shutdown();
        lifecycle.shutdown();

        assertEquals(List.of("second", "first"), calls);
        assertEquals(RuntimeLifecycle.State.STOPPED, lifecycle.state());
    }
}
