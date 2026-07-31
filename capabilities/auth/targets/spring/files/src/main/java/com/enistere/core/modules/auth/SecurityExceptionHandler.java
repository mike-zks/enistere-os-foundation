package com.enistere.core.modules.auth;

import com.enistere.core.common.exception.ApiError;
import com.enistere.core.common.web.CorrelationIdFilter;
import com.enistere.core.modules.audit.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Turns an authorization refusal raised during request handling into the
 * canonical 403 (ADR-069).
 *
 * <p>Spring denies in two distinct places. Rules evaluated before dispatch are
 * handled by the filter chain's {@code accessDeniedHandler}; method security
 * ({@code @PreAuthorize}) instead throws inside the dispatcher, where
 * {@code GlobalExceptionHandler}'s catch-all would classify it as an internal
 * error and answer 500. This advice takes precedence over that catch-all so a
 * denial stays a denial.
 *
 * <p>Both paths share {@link SecurityErrorCodes} and {@link SecurityAuditEvents}:
 * two entry points, one policy.
 */
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SecurityExceptionHandler {

    private final AuditService auditService;

    public SecurityExceptionHandler(AuditService auditService) {
        this.auditService = auditService;
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        SecurityConfig.auditDenial(auditService, request);
        Object id = request.getAttribute(CorrelationIdFilter.REQUEST_ID_ATTRIBUTE);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiError.of(
            HttpStatus.FORBIDDEN.value(),
            SecurityErrorCodes.AUTH_FORBIDDEN,
            "Access denied",
            null,
            request.getRequestURI(),
            id instanceof String value ? value : null
        ));
    }
}
