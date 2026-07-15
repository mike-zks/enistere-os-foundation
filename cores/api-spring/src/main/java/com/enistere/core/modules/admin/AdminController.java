package com.enistere.core.modules.admin;

import com.enistere.core.modules.audit.AuditEventType;
import com.enistere.core.modules.audit.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AuditService auditService;

    public AdminController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping("/ping")
    @PreAuthorize("hasAuthority('admin.access')")
    public ResponseEntity<Map<String, String>> ping(Authentication auth, HttpServletRequest httpRequest) {
        auditService.record(AuditEventType.ADMIN_ACCESS, extractUserId(auth), "admin", "ping",
            httpRequest.getRemoteAddr(), httpRequest.getHeader("User-Agent"));
        return ResponseEntity.ok(Map.of("status", "ok", "scope", "admin"));
    }

    private UUID extractUserId(Authentication auth) {
        if (auth != null && auth.getDetails() instanceof String s && !s.isEmpty()) {
            try {
                return UUID.fromString(s);
            } catch (IllegalArgumentException ignored) {
            }
        }
        return null;
    }
}
