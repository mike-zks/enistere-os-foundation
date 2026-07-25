package com.enistere.core.platform.lifecycle;

import jakarta.annotation.PreDestroy;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.atomic.AtomicReference;

@Component
public class RuntimeLifecycle {

    public enum State { STARTING, READY, DRAINING, STOPPED }

    private final AtomicReference<State> state = new AtomicReference<>(State.STARTING);
    private final Deque<Runnable> shutdownHooks = new ArrayDeque<>();

    @EventListener(ApplicationReadyEvent.class)
    public void ready() {
        state.set(State.READY);
    }

    public synchronized void registerShutdownHook(Runnable hook) {
        if (state.get() == State.DRAINING || state.get() == State.STOPPED) {
            throw new IllegalStateException("Cannot register a shutdown hook while runtime is " + state.get());
        }
        shutdownHooks.push(hook);
    }

    @PreDestroy
    public synchronized void shutdown() {
        if (state.get() == State.DRAINING || state.get() == State.STOPPED) return;
        state.set(State.DRAINING);
        shutdownHooks.forEach(Runnable::run);
        state.set(State.STOPPED);
    }

    public State state() {
        return state.get();
    }
}
