package com.enistere.core.common.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.spi.LoggingEventBuilder;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerMapping;

import java.io.IOException;

/**
 * HTTP request-completion log (ADR-049) — one structured line per request at its
 * end, correlated by the requestId MDC (set by {@link CorrelationIdFilter}).
 * Mirrors the NestJS HTTP log: {@code method}, normalized {@code route},
 * {@code statusCode}, {@code durationMs}, as structured key-values picked up by
 * Spring Boot's structured logging.
 *
 * <p>Levels: {@code 5xx → error}, {@code 429 → warn}, otherwise {@code info}.
 * Successful {@code /health/*} probes are not logged (noise). No sensitive field
 * (header, body, query, signed URL) is ever emitted.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger("http.access");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long startNanos = System.nanoTime();
        try {
            chain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
            int status = response.getStatus();
            String route = route(request);
            if (isHealthProbe(route) && status < 400) {
                return; // do not log successful health probes
            }
            builderFor(status)
                .addKeyValue("method", request.getMethod())
                .addKeyValue("route", route)
                .addKeyValue("statusCode", status)
                .addKeyValue("durationMs", durationMs)
                .log("request completed");
        }
    }

    private LoggingEventBuilder builderFor(int status) {
        if (status >= 500) return log.atError();
        if (status == 429) return log.atWarn();
        return log.atInfo();
    }

    /** Normalized route (matched pattern, e.g. {@code /api/v1/files/{id}}) or the raw URI. */
    private static String route(HttpServletRequest request) {
        Object pattern = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        return pattern instanceof String value ? value : request.getRequestURI();
    }

    private static boolean isHealthProbe(String route) {
        return route.startsWith("/health") || route.startsWith("/actuator/health");
    }
}
