package com.enistere.core.modules.auth;

/**
 * Public error codes emitted by the shared security filter chain (ADR-069).
 *
 * <p>The chain lives in the Auth overlay because Auth owns it, but the responses
 * it produces are consumed by whichever capability makes them reachable: RBAC is
 * what turns a 403 into an ordinary outcome. Keeping the code here — rather than
 * duplicating it in every capability that can be denied — leaves exactly one
 * definition of what a refusal looks like on the wire.
 */
public final class SecurityErrorCodes {

    private SecurityErrorCodes() {
    }

    /** Authenticated, but not allowed. Deliberately says nothing about the missing grant. */
    public static final String AUTH_FORBIDDEN = "AUTH_FORBIDDEN";

    /** Not authenticated, or session unusable. */
    public static final String UNAUTHORIZED = "UNAUTHORIZED";
}
