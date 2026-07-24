package com.enistere.core.modules.auth;

/**
 * Audit event types emitted by the Auth capability. The base audit infrastructure
 * imposes no registry (ADR-055 §5 / ADR-056): each capability declares its own
 * stable SCREAMING_SNAKE_CASE identifiers and records them via the base AuditService.
 */
public final class AuthAuditEvents {

    private AuthAuditEvents() {
    }

    public static final String LOGIN_SUCCEEDED = "AUTH_LOGIN_SUCCEEDED";
    public static final String LOGIN_FAILED = "AUTH_LOGIN_FAILED";
    public static final String REFRESH_SUCCEEDED = "AUTH_REFRESH_SUCCEEDED";
    public static final String LOGOUT = "AUTH_LOGOUT";
}
