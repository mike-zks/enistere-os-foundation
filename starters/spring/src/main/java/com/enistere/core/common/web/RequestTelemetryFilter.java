package com.enistere.core.common.web;

import com.enistere.core.platform.observability.TelemetryPort;
import com.enistere.core.platform.observability.TraceContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerMapping;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RequestTelemetryFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestTelemetryFilter.class);
    private final TelemetryPort telemetry;

    public RequestTelemetryFilter(TelemetryPort telemetry) {
        this.telemetry = telemetry;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        TraceContext trace = TraceContext.continueOrCreate(request.getHeader("traceparent"));
        response.setHeader("traceparent", trace.traceparent());
        MDC.put("traceId", trace.traceId());
        long start = System.nanoTime();
        try {
            chain.doFilter(request, response);
        } finally {
            try {
                telemetry.recordRequest(
                    request.getMethod(), normalizedRoute(request), response.getStatus(),
                    System.nanoTime() - start, trace.traceId());
            } catch (RuntimeException telemetryFailure) {
                log.warn("Telemetry export failed: errorType={}",
                    telemetryFailure.getClass().getSimpleName());
            }
            MDC.remove("traceId");
        }
    }

    private static String normalizedRoute(HttpServletRequest request) {
        Object pattern = request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        return pattern instanceof String value ? value : "unmatched";
    }
}
