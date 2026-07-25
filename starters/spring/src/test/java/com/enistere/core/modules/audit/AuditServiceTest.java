package com.enistere.core.modules.audit;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class AuditServiceTest {

    private final AtomicReference<AuditLog> persisted = new AtomicReference<>();
    private final AtomicBoolean fail = new AtomicBoolean();
    private final AuditLogRepository repository = repositoryDouble();
    private final AuditService service = new AuditService(repository);

    @Test
    void persistsAGenericAuditEntry() {
        service.record("AUTH_LOGIN_SUCCEEDED", UUID.randomUUID(), "auth", null, "127.0.0.1", "JUnit");
        assertNotNull(persisted.get());
    }

    @Test
    void aRepositoryFailureNeverPropagatesToTheCaller() {
        fail.set(true);
        assertDoesNotThrow(() -> service.record("X", null, null, null, null, null));
    }

    @Test
    void truncatesOversizedClientMetadata() {
        service.record("E", null, null, null, "x".repeat(100), "y".repeat(1000));
        assertEquals(45, persisted.get().getIpAddress().length());
        assertEquals(512, persisted.get().getUserAgent().length());
    }

    private AuditLogRepository repositoryDouble() {
        return (AuditLogRepository) Proxy.newProxyInstance(
            AuditLogRepository.class.getClassLoader(),
            new Class<?>[] { AuditLogRepository.class },
            (proxy, method, arguments) -> {
                if (method.getName().equals("save")) {
                    if (fail.get()) throw new RuntimeException("db down");
                    AuditLog entry = (AuditLog) arguments[0];
                    persisted.set(entry);
                    return entry;
                }
                if (method.getName().equals("toString")) return "AuditLogRepositoryDouble";
                if (method.getReturnType().equals(boolean.class)) return false;
                if (method.getReturnType().equals(long.class)) return 0L;
                if (method.getReturnType().equals(int.class)) return 0;
                return null;
            });
    }
}
