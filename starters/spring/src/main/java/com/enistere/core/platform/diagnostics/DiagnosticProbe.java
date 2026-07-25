package com.enistere.core.platform.diagnostics;

/** Bounded internal diagnostics probe. */
public interface DiagnosticProbe {
    String id();
    DiagnosticStatus check();
}
