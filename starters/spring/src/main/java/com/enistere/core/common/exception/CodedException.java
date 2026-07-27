package com.enistere.core.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Baseline canonical error carrying an explicit application {@code errorCode}
 * (ADR-048, ADR-068).
 *
 * <p>{@link ResponseStatusException} alone can only yield the HTTP status name
 * ({@code UNAUTHORIZED}), which is not a stable application code. Capabilities
 * need to state <em>why</em> a request failed in the {@code DOMAIN_ERROR_REASON}
 * form shared with the other API runtimes, without introducing a second
 * error-mapping path: this type is the single seam for that, and
 * {@link GlobalExceptionHandler} keeps the flat envelope unchanged.
 *
 * <p>The {@code message} must stay generic and non-revealing: it is returned to
 * the caller as-is.
 */
public class CodedException extends ResponseStatusException {

    private final String errorCode;

    public CodedException(HttpStatus status, String errorCode, String message) {
        super(status, message);
        this.errorCode = errorCode;
    }

    /** Stable application error code, e.g. {@code AUTH_INVALID_CREDENTIALS}. */
    public String getErrorCode() {
        return errorCode;
    }
}
