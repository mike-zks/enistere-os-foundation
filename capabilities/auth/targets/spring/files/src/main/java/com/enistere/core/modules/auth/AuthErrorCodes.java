package com.enistere.core.modules.auth;

/**
 * Public error codes of the Authentication capability (ADR-068).
 *
 * <p>These are the codes the caller observes in the canonical flat envelope. They
 * are deliberately coarse: every credential failure collapses into
 * {@code AUTH_INVALID_CREDENTIALS} and every refresh failure into
 * {@code AUTH_REFRESH_TOKEN_INVALID}, so the response never reveals whether an
 * identity exists, is disabled, or which token state was hit. The finer reasons
 * live in the audit trail, not in the response.
 */
public final class AuthErrorCodes {

    private AuthErrorCodes() {
    }

    public static final String AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS";
    public static final String AUTH_REFRESH_TOKEN_INVALID = "AUTH_REFRESH_TOKEN_INVALID";
    public static final String AUTH_RATE_LIMITED = "AUTH_RATE_LIMITED";
}
