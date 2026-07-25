package com.enistere.core.platform.diagnostics;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/** Internal diagnostics aggregator with deterministic, sanitized output. */
@Component
public class RuntimeDiagnostics {

    private final List<DiagnosticProbe> probes;
    private final Clock clock;

    @Autowired
    public RuntimeDiagnostics(List<DiagnosticProbe> probes) {
        this(probes, Clock.systemUTC());
    }

    RuntimeDiagnostics(List<DiagnosticProbe> probes, Clock clock) {
        this.probes = List.copyOf(probes);
        this.clock = clock;
        var ids = this.probes.stream().map(DiagnosticProbe::id).toList();
        if (ids.stream().distinct().count() != ids.size()) {
            throw new IllegalArgumentException("Diagnostic probe ids must be unique");
        }
        if (ids.stream().anyMatch(id -> id == null || !id.matches("^[a-z][a-z0-9-]{1,62}$"))) {
            throw new IllegalArgumentException("Invalid diagnostic probe id");
        }
    }

    public DiagnosticSnapshot snapshot() {
        Map<String, DiagnosticStatus> checks = new TreeMap<>();
        for (DiagnosticProbe probe : probes) {
            try {
                checks.put(probe.id(), probe.check());
            } catch (RuntimeException ignored) {
                checks.put(probe.id(), DiagnosticStatus.DEGRADED);
            }
        }
        var status = checks.containsValue(DiagnosticStatus.DEGRADED)
            ? DiagnosticStatus.DEGRADED : DiagnosticStatus.OK;
        return new DiagnosticSnapshot(
            status,
            Instant.now(clock),
            Collections.unmodifiableMap(new TreeMap<>(checks)));
    }
}
