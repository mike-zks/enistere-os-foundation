package com.enistere.core.modules.files;

import com.enistere.core.AbstractIntegrationTest;
import com.enistere.core.TestDataFactory;
import com.enistere.core.modules.files.storage.FakeStorageService;
import com.enistere.core.modules.audit.AuditLog;
import com.enistere.core.modules.audit.AuditLogRepository;
import com.enistere.core.modules.users.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Quarantine responsibility: administrative access suspension, at parity with
 * the NestJS authority. Distinct from the owner-facing endpoints in that the
 * permission — not ownership — is what authorizes the operation.
 */
class FilesQuarantineIntegrationTest extends AbstractIntegrationTest {

    @Autowired private TestDataFactory factory;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private StoredFileRepository repository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private FakeStorageService storage;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private String ownerEmail;
    private String adminEmail;
    private final String password = "quarantine-test-pwd";

    @BeforeEach
    void setup() {
        ownerEmail = factory.uniqueEmail();
        adminEmail = factory.uniqueEmail();
        User owner = factory.createUser(ownerEmail, password);
        User admin = factory.createUser(adminEmail, password);
        FilesTestAccess.grant(jdbcTemplate, owner.getId(),
            "files.upload", "files.read", "files.download");
        // The administrator owns nothing here — only the permissions.
        FilesTestAccess.grant(jdbcTemplate, admin.getId(),
            "files.quarantine", "files.restore");
    }

    @Test
    void quarantine_withoutPermission_returns403_evenForTheOwner() throws Exception {
        String ownerToken = loginAndGetToken(ownerEmail);
        String id = uploadValidated(ownerToken, "mine.txt");

        // Ownership is not authority: the owner cannot quarantine their own file.
        mockMvc.perform(post("/api/v1/files/" + id + "/quarantine")
                .header("Authorization", "Bearer " + ownerToken))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.errorCode").value("AUTH_FORBIDDEN"));
        assertThat(repository.findById(UUID.fromString(id)).orElseThrow().getStatus())
            .isEqualTo(FileStatus.VALIDATED);
    }

    @Test
    void quarantine_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/files/00000000-0000-0000-0000-000000000001/quarantine"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void quarantine_byAdmin_blocksDownloadWithoutOwnership() throws Exception {
        String ownerToken = loginAndGetToken(ownerEmail);
        String id = uploadValidated(ownerToken, "suspect.txt");

        mockMvc.perform(get("/api/v1/files/" + id + "/download-url")
                .header("Authorization", "Bearer " + ownerToken))
            .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/files/" + id + "/quarantine")
                .header("Authorization", "Bearer " + loginAndGetToken(adminEmail)))
            .andExpect(status().isOk());

        assertThat(repository.findById(UUID.fromString(id)).orElseThrow().getStatus())
            .isEqualTo(FileStatus.QUARANTINED);
        // The owner keeps the file but loses access to its content.
        mockMvc.perform(get("/api/v1/files/" + id + "/download-url")
                .header("Authorization", "Bearer " + ownerToken))
            .andExpect(status().isNotFound());
    }

    @Test
    void quarantine_isIdempotent() throws Exception {
        String id = uploadValidated(loginAndGetToken(ownerEmail), "twice.txt");
        String adminToken = loginAndGetToken(adminEmail);

        mockMvc.perform(post("/api/v1/files/" + id + "/quarantine")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/files/" + id + "/quarantine")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk());
    }

    @Test
    void quarantine_fromAnIneligibleStatus_returns409_withoutDisclosingIt() throws Exception {
        String id = uploadValidated(loginAndGetToken(ownerEmail), "deleted.txt");
        StoredFile file = repository.findById(UUID.fromString(id)).orElseThrow();
        file.setStatus(FileStatus.DELETED);
        repository.save(file);

        MvcResult result = mockMvc.perform(post("/api/v1/files/" + id + "/quarantine")
                .header("Authorization", "Bearer " + loginAndGetToken(adminEmail)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.errorCode").value("FILE_QUARANTINE_INVALID_STATUS"))
            .andReturn();
        // The refusal must not name the status that blocked it.
        assertThat(result.getResponse().getContentAsString()).doesNotContain("DELETED");
    }

    @Test
    void quarantine_unknownFile_returns404() throws Exception {
        mockMvc.perform(post("/api/v1/files/00000000-0000-0000-0000-0000000000ff/quarantine")
                .header("Authorization", "Bearer " + loginAndGetToken(adminEmail)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.errorCode").value("FILE_NOT_FOUND"));
    }

    @Test
    void restore_returnsAccessToTheOwner() throws Exception {
        String ownerToken = loginAndGetToken(ownerEmail);
        String adminToken = loginAndGetToken(adminEmail);
        String id = uploadValidated(ownerToken, "cleared.txt");

        mockMvc.perform(post("/api/v1/files/" + id + "/quarantine")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/files/" + id + "/restore")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk());

        assertThat(repository.findById(UUID.fromString(id)).orElseThrow().getStatus())
            .isEqualTo(FileStatus.VALIDATED);
        mockMvc.perform(get("/api/v1/files/" + id + "/download-url")
                .header("Authorization", "Bearer " + ownerToken))
            .andExpect(status().isOk());
    }

    @Test
    void restore_isRefusedWhenTheObjectHasVanished() throws Exception {
        String id = uploadValidated(loginAndGetToken(ownerEmail), "gone.txt");
        String adminToken = loginAndGetToken(adminEmail);
        mockMvc.perform(post("/api/v1/files/" + id + "/quarantine")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk());

        // The object disappears from the bucket while the file is quarantined.
        storage.forget(repository.findById(UUID.fromString(id)).orElseThrow().getStorageKey());
        auditLogRepository.deleteAll();

        mockMvc.perform(post("/api/v1/files/" + id + "/restore")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.errorCode").value("FILE_RESTORE_INVALID_STATUS"));
        // Restoring would advertise a file that cannot be downloaded.
        assertThat(repository.findById(UUID.fromString(id)).orElseThrow().getStatus())
            .isEqualTo(FileStatus.QUARANTINED);
        assertThat(auditLogRepository.findAll()).extracting(AuditLog::getEventType)
            .contains("FILE_STORAGE_OBJECT_MISSING");
    }

    @Test
    void restore_ofANonQuarantinedFile_returns409() throws Exception {
        String id = uploadValidated(loginAndGetToken(ownerEmail), "never-quarantined.txt");
        StoredFile file = repository.findById(UUID.fromString(id)).orElseThrow();
        file.setStatus(FileStatus.REJECTED);
        repository.save(file);

        mockMvc.perform(post("/api/v1/files/" + id + "/restore")
                .header("Authorization", "Bearer " + loginAndGetToken(adminEmail)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.errorCode").value("FILE_RESTORE_INVALID_STATUS"));
    }

    @Test
    void restore_withoutPermission_returns403() throws Exception {
        String ownerToken = loginAndGetToken(ownerEmail);
        String id = uploadValidated(ownerToken, "not-mine-to-restore.txt");
        mockMvc.perform(post("/api/v1/files/" + id + "/quarantine")
                .header("Authorization", "Bearer " + loginAndGetToken(adminEmail)))
            .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/files/" + id + "/restore")
                .header("Authorization", "Bearer " + ownerToken))
            .andExpect(status().isForbidden());
    }

    @Test
    void quarantineAndRestore_recordBusinessAuditEvents() throws Exception {
        String id = uploadValidated(loginAndGetToken(ownerEmail), "audited.txt");
        String adminToken = loginAndGetToken(adminEmail);
        auditLogRepository.deleteAll();

        mockMvc.perform(post("/api/v1/files/" + id + "/quarantine")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/files/" + id + "/restore")
                .header("Authorization", "Bearer " + adminToken))
            .andExpect(status().isOk());

        List<AuditLog> logs = auditLogRepository.findAll();
        assertThat(logs).extracting(AuditLog::getEventType)
            .contains("FILE_QUARANTINED", "FILE_QUARANTINE_RELEASED");
    }

    // helpers

    /** Uploads a file and brings it to VALIDATED, the only quarantinable status. */
    private String uploadValidated(String token, String name) throws Exception {
        MockMultipartFile file = new MockMultipartFile(
            "file", name, "text/plain", ("content of " + name).getBytes(StandardCharsets.UTF_8));
        MvcResult result = mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file)
                .param("category", "DOCUMENT")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isCreated())
            .andReturn();
        String id = objectMapper.readTree(result.getResponse().getContentAsString())
            .get("id").asText();
        StoredFile stored = repository.findById(UUID.fromString(id)).orElseThrow();
        stored.setStatus(FileStatus.VALIDATED);
        repository.save(stored);
        return id;
    }

    private String loginAndGetToken(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password)))
            .andExpect(status().isOk())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
            .get("accessToken").asText();
    }
}
