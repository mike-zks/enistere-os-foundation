package com.enistere.core.modules.auth;

/**
 * Business audit events emitted by the shared security filter chain (ADR-069).
 *
 * <p>An authorization refusal is decided by Spring Security, not by application
 * code, so it cannot be audited from a guard the way a runtime with explicit
 * guards does. The chain records it instead, which keeps the observable
 * guarantee — every denial is auditable — identical across runtimes even though
 * the emission point differs.
 */
public final class SecurityAuditEvents {

    private SecurityAuditEvents() {
    }

    public static final String AUTHORIZATION_DENIED = "AUTHORIZATION_DENIED";
}
