package com.enistere.core.modules.files;

import com.enistere.core.AbstractIntegrationTest;
import com.enistere.core.TestDataFactory;
import com.enistere.core.modules.files.FilesConfig;
import com.enistere.core.modules.audit.AuditLog;
import com.enistere.core.modules.audit.AuditLogRepository;
import com.enistere.core.modules.users.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Quota responsibility. The invariant is specifically about races, so the
 * decisive test uploads concurrently rather than sequentially.
 */
class FilesQuotaIntegrationTest extends AbstractIntegrationTest {

    @Autowired private TestDataFactory factory;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private StoredFileRepository repository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private FilesConfig filesConfig;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private String email;
    private User user;
    private final String password = "quota-test-pwd";

    @BeforeEach
    void setup() {
        email = factory.uniqueEmail();
        user = factory.createUser(email, password);
        FilesTestAccess.grant(jdbcTemplate, user.getId(), "files.upload", "files.read");
    }

    @AfterEach
    void resetLimits() {
        filesConfig.setOwnerMaxActiveFiles(0);
        filesConfig.setOwnerMaxTotalBytes(0L);
    }

    @Test
    void unlimitedByDefault() throws Exception {
        String token = loginAndGetToken();
        for (int i = 0; i < 3; i++) {
            upload(token, "file-" + i + ".txt").andExpect(status().isCreated());
        }
        assertThat(repository.countActiveByOwner(user.getId(), FileQuotaService.ACTIVE_STATUSES))
            .isEqualTo(3);
    }

    @Test
    void activeFileCountIsEnforced() throws Exception {
        filesConfig.setOwnerMaxActiveFiles(2);
        String token = loginAndGetToken();

        upload(token, "one.txt").andExpect(status().isCreated());
        upload(token, "two.txt").andExpect(status().isCreated());
        upload(token, "three.txt")
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.errorCode").value("FILE_STORAGE_QUOTA_EXCEEDED"));
    }

    @Test
    void quotaRejectionDoesNotDiscloseTheLimit() throws Exception {
        filesConfig.setOwnerMaxActiveFiles(1);
        String token = loginAndGetToken();
        upload(token, "first.txt").andExpect(status().isCreated());

        MvcResult result = upload(token, "second.txt")
            .andExpect(status().isConflict())
            .andReturn();
        // The configured limit is operator configuration, not caller information:
        // the message states the outcome, never the threshold or current usage.
        String message = objectMapper.readTree(result.getResponse().getContentAsString())
            .get("message").asText();
        assertThat(message).isEqualTo("Storage quota exceeded");
    }

    @Test
    void deletedFilesStopConsumingQuota() throws Exception {
        filesConfig.setOwnerMaxActiveFiles(1);
        String token = loginAndGetToken();
        String id = idOf(upload(token, "temp.txt").andExpect(status().isCreated()).andReturn());

        upload(token, "blocked.txt").andExpect(status().isConflict());

        StoredFile file = repository.findById(java.util.UUID.fromString(id)).orElseThrow();
        file.setStatus(FileStatus.DELETED);
        repository.save(file);

        // The slot is freed: an owner is not charged for content they removed.
        upload(token, "now-allowed.txt").andExpect(status().isCreated());
    }

    @Test
    void totalSizeIsEnforced() throws Exception {
        filesConfig.setOwnerMaxTotalBytes(40L);
        String token = loginAndGetToken();
        upload(token, "small.txt").andExpect(status().isCreated());
        // "content of huge.txt" padded well past the 40-byte allowance.
        uploadOfSize(token, "huge.txt", 200)
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.errorCode").value("FILE_STORAGE_QUOTA_EXCEEDED"));
    }

    @Test
    void quotaHoldsUnderConcurrentUploads() throws Exception {
        int limit = 3;
        // Deliberately below the connection pool size. Each racer holds a
        // connection while it waits on the per-owner advisory lock, so saturating
        // the pool would test capacity, not the quota invariant — and would fail
        // for a reason that has nothing to do with quotas.
        int attempts = 6;
        filesConfig.setOwnerMaxActiveFiles(limit);
        String token = loginAndGetToken();

        // The whole point of the invariant: several uploads racing for three slots.
        // A check-then-insert without the advisory lock lets several readers see
        // the same count and all pass.
        ExecutorService pool = Executors.newFixedThreadPool(attempts);
        try {
            List<Callable<Integer>> tasks = IntStream.range(0, attempts)
                .<Callable<Integer>>mapToObj(i -> () ->
                    upload(token, "race-" + i + ".txt").andReturn().getResponse().getStatus())
                .toList();
            List<Future<Integer>> futures = pool.invokeAll(tasks, 60, TimeUnit.SECONDS);

            int created = 0;
            for (Future<Integer> future : futures) {
                if (future.get() == 201) created++;
            }
            assertThat(created).isEqualTo(limit);
        } finally {
            pool.shutdownNow();
        }

        assertThat(repository.countActiveByOwner(user.getId(), FileQuotaService.ACTIVE_STATUSES))
            .isEqualTo(limit);
    }

    @Test
    void quotaRejectionIsAudited() throws Exception {
        filesConfig.setOwnerMaxActiveFiles(1);
        String token = loginAndGetToken();
        upload(token, "first.txt").andExpect(status().isCreated());
        auditLogRepository.deleteAll();

        upload(token, "refused.txt").andExpect(status().isConflict());

        assertThat(auditLogRepository.findAll()).extracting(AuditLog::getEventType)
            .contains("FILE_QUOTA_EXCEEDED");
    }

    // helpers

    private org.springframework.test.web.servlet.ResultActions upload(String token, String name)
            throws Exception {
        return uploadOfSize(token, name, 0);
    }

    private org.springframework.test.web.servlet.ResultActions uploadOfSize(
            String token, String name, int padding) throws Exception {
        String body = "content of " + name + "x".repeat(Math.max(0, padding));
        MockMultipartFile file = new MockMultipartFile(
            "file", name, "text/plain", body.getBytes(StandardCharsets.UTF_8));
        return mockMvc.perform(multipart("/api/v1/files/upload")
            .file(file)
            .param("category", "DOCUMENT")
            .header("Authorization", "Bearer " + token));
    }

    private String idOf(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String loginAndGetToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password)))
            .andExpect(status().isOk())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
            .get("accessToken").asText();
    }
}
