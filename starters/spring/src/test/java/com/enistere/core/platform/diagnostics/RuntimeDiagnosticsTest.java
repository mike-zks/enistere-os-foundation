package com.enistere.core.platform.diagnostics;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RuntimeDiagnosticsTest {

    private static final Clock CLOCK =
        Clock.fixed(Instant.parse("2026-07-25T00:00:00Z"), ZoneOffset.UTC);

    @Test
    void returnsSortedSanitizedStatesAndHidesProbeFailures() {
        DiagnosticProbe storage = probe("storage", DiagnosticStatus.OK);
        DiagnosticProbe cache = new DiagnosticProbe() {
            public String id() { return "cache"; }
            public DiagnosticStatus check() { throw new IllegalStateException("redis://secret"); }
        };

        var snapshot = new RuntimeDiagnostics(List.of(storage, cache), CLOCK).snapshot();

        assertThat(snapshot.status()).isEqualTo(DiagnosticStatus.DEGRADED);
        assertThat(snapshot.timestamp()).isEqualTo(Instant.parse("2026-07-25T00:00:00Z"));
        assertThat(snapshot.checks()).containsExactly(
            org.assertj.core.api.Assertions.entry("cache", DiagnosticStatus.DEGRADED),
            org.assertj.core.api.Assertions.entry("storage", DiagnosticStatus.OK));
        assertThat(snapshot.toString()).doesNotContain("secret");
    }

    @Test
    void refusesDuplicateProbeIdentifiers() {
        assertThatThrownBy(() -> new RuntimeDiagnostics(
            List.of(probe("database", DiagnosticStatus.OK), probe("database", DiagnosticStatus.OK)),
            CLOCK)).isInstanceOf(IllegalArgumentException.class);
    }

    private static DiagnosticProbe probe(String id, DiagnosticStatus status) {
        return new DiagnosticProbe() {
            public String id() { return id; }
            public DiagnosticStatus check() { return status; }
        };
    }
}
