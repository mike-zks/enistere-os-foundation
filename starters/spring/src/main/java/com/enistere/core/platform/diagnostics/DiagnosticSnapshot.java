package com.enistere.core.platform.diagnostics;

import java.time.Instant;
import java.util.Map;

/** Sanitized snapshot: state only, never exception messages or infrastructure details. */
public record DiagnosticSnapshot(
    DiagnosticStatus status,
    Instant timestamp,
    Map<String, DiagnosticStatus> checks
) {
}
