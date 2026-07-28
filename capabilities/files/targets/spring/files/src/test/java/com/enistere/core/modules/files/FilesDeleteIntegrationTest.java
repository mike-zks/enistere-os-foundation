package com.enistere.core.modules.files;

import com.enistere.core.AbstractIntegrationTest;
import com.enistere.core.TestDataFactory;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Delete responsibility: object and metadata removal, idempotency, download-URL
 * invalidation and its own permission, at parity with the NestJS authority.
 */
class FilesDeleteIntegrationTest extends AbstractIntegrationTest {

    @Autowired private TestDataFactory factory;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private StoredFileRepository repository;
    @Autowired private AuditLogRepository auditLogRepository;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private String ownerEmail;
    private String otherEmail;
    private final String password = "delete-test-pwd";

    @BeforeEach
    void setup() {
        ownerEmail = factory.uniqueEmail();
        otherEmail = factory.uniqueEmail();
        User owner = factory.createUser(ownerEmail, password);
        User other = factory.createUser(otherEmail, password);
        FilesTestAccess.grant(jdbcTemplate, owner.getId(),
            "files.upload", "files.read", "files.download", "files.delete");
        FilesTestAccess.grant(jdbcTemplate, other.getId(),
            "files.upload", "files.read", "files.download", "files.delete");
    }

    @Test
    void delete_withoutToken_returns401() throws Exception {
        mockMvc.perform(delete("/api/v1/files/00000000-0000-0000-0000-000000000001"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void delete_withoutDeletePermission_returns403() throws Exception {
        String strangerEmail = factory.uniqueEmail();
        User stranger = factory.createUser(strangerEmail, password);
        FilesTestAccess.grant(jdbcTemplate, stranger.getId(), "files.upload", "files.read");
        String strangerToken = loginAndGetToken(strangerEmail);
        String id = upload(strangerToken, "cannot-delete.txt");

        mockMvc.perform(delete("/api/v1/files/" + id)
                .header("Authorization", "Bearer " + strangerToken))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.errorCode").value("AUTH_FORBIDDEN"));
        // Ownership never substitutes for the permission.
        assertThat(repository.findById(UUID.fromString(id)).orElseThrow().getStatus())
            .isNotEqualTo(FileStatus.DELETED);
    }

    @Test
    void delete_removesTheFileAndInvalidatesItsDownloadUrl() throws Exception {
        String token = loginAndGetToken(ownerEmail);
        String id = upload(token, "doomed.txt");

        // A URL issued before the deletion must stop resolving afterwards.
        mockMvc.perform(get("/api/v1/files/" + id + "/download-url")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/files/" + id)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNoContent());

        assertThat(repository.findById(UUID.fromString(id)).orElseThrow().getStatus())
            .isEqualTo(FileStatus.DELETED);
        mockMvc.perform(get("/api/v1/files/" + id + "/download-url")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/files/" + id)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNotFound());
    }

    @Test
    void delete_isIdempotent() throws Exception {
        String token = loginAndGetToken(ownerEmail);
        String id = upload(token, "twice.txt");

        mockMvc.perform(delete("/api/v1/files/" + id)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNoContent());
        // A retried request must not become a 404 the caller has to special-case.
        mockMvc.perform(delete("/api/v1/files/" + id)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNoContent());
    }

    @Test
    void delete_ofAnotherUserFile_isRefusedWithoutRevealingIt() throws Exception {
        String id = upload(loginAndGetToken(otherEmail), "not-yours.txt");

        mockMvc.perform(delete("/api/v1/files/" + id)
                .header("Authorization", "Bearer " + loginAndGetToken(ownerEmail)))
            .andExpect(status().isNoContent());
        // Non-revealing, but the file is untouched.
        assertThat(repository.findById(UUID.fromString(id)).orElseThrow().getStatus())
            .isNotEqualTo(FileStatus.DELETED);
    }

    @Test
    void delete_recordsBusinessAuditEvents() throws Exception {
        String token = loginAndGetToken(ownerEmail);
        String id = upload(token, "audited.txt");
        auditLogRepository.deleteAll();

        mockMvc.perform(delete("/api/v1/files/" + id)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNoContent());

        List<AuditLog> logs = auditLogRepository.findAll();
        assertThat(logs).extracting(AuditLog::getEventType).contains(
            "FILE_DELETION_REQUESTED", "FILE_OBJECT_DELETED", "FILE_DELETED");
    }

    // helpers

    private String upload(String token, String name) throws Exception {
        MockMultipartFile file = new MockMultipartFile(
            "file", name, "text/plain", ("content of " + name).getBytes(StandardCharsets.UTF_8));
        MvcResult result = mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file)
                .param("category", "DOCUMENT")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isCreated())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
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
