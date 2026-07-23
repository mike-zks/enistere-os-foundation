package com.enistere.core.common.exception;

import java.time.Instant;

/**
 * Canonical API error envelope (ADR-048) — the flat {@code ApiErrorResponse}
 * shape shared with {@code @enistere/api-contracts} and consumed by the generated
 * client. Flat and non-sensitive: never a stack trace, a secret or an internal
 * detail. Field order matches the canonical contract.
 *
 * @param success    always {@code false} for an error response
 * @param statusCode HTTP status code
 * @param errorCode  stable application error code ({@code DOMAIN_ERROR_REASON})
 * @param message    generic, non-sensitive message
 * @param details    optional structured details (e.g. flat validation errors)
 * @param path       request path
 * @param timestamp  error instant
 * @param requestId  correlation id (X-Request-Id); not a security datum
 */
public record ApiError(
    boolean success,
    int statusCode,
    String errorCode,
    String message,
    Object details,
    String path,
    Instant timestamp,
    String requestId
) {
    /** Builds an error envelope, stamping {@code success=false} and the timestamp. */
    public static ApiError of(int statusCode, String errorCode, String message, Object details, String path, String requestId) {
        return new ApiError(false, statusCode, errorCode, message, details, path, Instant.now(), requestId);
    }
}
