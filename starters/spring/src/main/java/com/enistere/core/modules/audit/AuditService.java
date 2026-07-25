package com.enistere.core.modules.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Generic audit sink of the API base. The infrastructure imposes no event
 * registry: each composed capability declares its own event types (stable
 * SCREAMING_SNAKE_CASE identifiers — e.g. {@code AuthAuditEvents}) and records
 * them here. Metadata is limited to non-sensitive primitives (never tokens,
 * hashes, passwords or full payloads).
 */
@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository repository;

    public AuditService(AuditLogRepository repository) {
        this.repository = repository;
    }

    // REQUIRES_NEW: the audit entry is committed independently of the caller's transaction.
    // A catch-all prevents a DB write failure from propagating to the caller (best-effort).
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String eventType, UUID userId, String targetType, String targetId,
                       String ipAddress, String userAgent) {
        try {
            AuditLog entry = new AuditLog();
            entry.setEventType(eventType);
            entry.setUserId(userId);
            entry.setTargetType(targetType);
            entry.setTargetId(targetId);
            entry.setIpAddress(truncate(ipAddress, 45));
            entry.setUserAgent(truncate(userAgent, 512));
            entry.setCreatedAt(Instant.now());
            repository.save(entry);
        } catch (Exception e) {
            log.error("Audit record failed: event={} userId={}", eventType, userId);
        }
    }

    private String truncate(String value, int max) {
        if (value == null) return null;
        return value.length() > max ? value.substring(0, max) : value;
    }
}
