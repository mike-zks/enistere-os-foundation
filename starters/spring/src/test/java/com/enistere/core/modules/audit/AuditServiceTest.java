package com.enistere.core.modules.audit;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuditServiceTest {

    private final AuditLogRepository repository = mock(AuditLogRepository.class);
    private final AuditService service = new AuditService(repository);

    @Test
    void persistsAGenericAuditEntry() {
        service.record("AUTH_LOGIN_SUCCEEDED", UUID.randomUUID(), "auth", null, "127.0.0.1", "JUnit");
        verify(repository).save(any(AuditLog.class));
    }

    @Test
    void aRepositoryFailureNeverPropagatesToTheCaller() {
        when(repository.save(any(AuditLog.class))).thenThrow(new RuntimeException("db down"));
        assertDoesNotThrow(() -> service.record("X", null, null, null, null, null));
    }

    @Test
    void truncatesOversizedClientMetadata() {
        service.record("E", null, null, null, "x".repeat(100), "y".repeat(1000));
        verify(repository).save(argThat(entry ->
            entry.getIpAddress().length() == 45 && entry.getUserAgent().length() == 512));
    }
}
