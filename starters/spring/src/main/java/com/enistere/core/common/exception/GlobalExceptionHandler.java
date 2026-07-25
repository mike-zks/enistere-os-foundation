package com.enistere.core.common.exception;

import com.enistere.core.common.web.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Maps exceptions to the canonical flat error envelope (ADR-048) — the same
 * {@code ApiErrorResponse} the generated client consumes. Never exposes a stack
 * trace or an internal detail. The {@code requestId} is the correlation id set by
 * {@link CorrelationIdFilter}.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static String requestId(HttpServletRequest request) {
        Object id = request.getAttribute(CorrelationIdFilter.REQUEST_ID_ATTRIBUTE);
        return id instanceof String value ? value : null;
    }

    private static ResponseEntity<ApiError> respond(int statusCode, String errorCode, String message, Object details, HttpServletRequest request) {
        return ResponseEntity.status(statusCode).body(
            ApiError.of(statusCode, errorCode, message, details, request.getRequestURI(), requestId(request))
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .toList();
        return respond(HttpStatus.BAD_REQUEST.value(), "VALIDATION_ERROR", "Validation failed", errors, request);
    }

    @ExceptionHandler(BindException.class)
    public ResponseEntity<ApiError> handleBind(BindException ex, HttpServletRequest request) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .toList();
        return respond(HttpStatus.BAD_REQUEST.value(), "VALIDATION_ERROR", "Validation failed", errors, request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleMessageNotReadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        return respond(HttpStatus.BAD_REQUEST.value(), "BAD_REQUEST", "Malformed or missing request body", null, request);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> handleMaxUploadSize(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        return respond(HttpStatus.PAYLOAD_TOO_LARGE.value(), "FILE_TOO_LARGE", "File size exceeds the maximum allowed", null, request);
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiError> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {
        return respond(HttpStatus.UNSUPPORTED_MEDIA_TYPE.value(), "UNSUPPORTED_MEDIA_TYPE", "Content type not supported", null, request);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleResponseStatus(ResponseStatusException ex, HttpServletRequest request) {
        int statusValue = ex.getStatusCode().value();
        String errorCode = ex.getStatusCode() instanceof HttpStatus hs ? hs.name() : String.valueOf(statusValue);
        String message = ex.getReason() != null ? ex.getReason() : "Error";
        return respond(statusValue, errorCode, message, null, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(Exception ex, HttpServletRequest request) {
        // Never expose stack traces — log internally, return an opaque error.
        return respond(HttpStatus.INTERNAL_SERVER_ERROR.value(), "INTERNAL_ERROR", "An unexpected error occurred", null, request);
    }
}
