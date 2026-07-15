package com.enistere.core.modules.audit;

import com.enistere.core.AbstractIntegrationTest;
import com.enistere.core.TestDataFactory;
import com.enistere.core.modules.permissions.Permission;
import com.enistere.core.modules.roles.Role;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuditIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private TestDataFactory factory;

    @Autowired
    private JdbcTemplate jdbc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private String email;
    private String password;

    @BeforeEach
    void setup() {
        email = factory.uniqueEmail();
        password = "audit-test-password-2026";
        factory.createUser(email, password);
    }

    @Test
    void loginSuccess_writesAuditEntry() throws Exception {
        int before = countByEventType("LOGIN_SUCCESS");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson(email, password)))
            .andExpect(status().isOk());

        assertThat(countByEventType("LOGIN_SUCCESS")).isGreaterThan(before);

        UUID userId = userIdForEmail(email);
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM audit_logs WHERE event_type = 'LOGIN_SUCCESS' AND user_id = ?",
            Integer.class, userId);
        assertThat(count).isGreaterThanOrEqualTo(1);
    }

    @Test
    void loginFailure_wrongPassword_writesAuditLoginFailure_withoutPassword() throws Exception {
        String wrongPassword = "secret-password-must-not-appear-in-logs";
        int before = countByEventType("LOGIN_FAILURE");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson(email, wrongPassword)))
            .andExpect(status().isUnauthorized());

        assertThat(countByEventType("LOGIN_FAILURE")).isGreaterThan(before);

        // Password must not appear in any audit_logs field
        Integer withPassword = jdbc.queryForObject(
            "SELECT COUNT(*) FROM audit_logs WHERE event_type = 'LOGIN_FAILURE' AND " +
            "(target_id = ? OR user_agent = ?)",
            Integer.class, wrongPassword, wrongPassword);
        assertThat(withPassword).isZero();
    }

    @Test
    void logout_writesAuditLogout() throws Exception {
        String token = loginAndGetAccessToken();
        int before = countByEventType("LOGOUT");

        mockMvc.perform(post("/api/v1/auth/logout")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNoContent());

        assertThat(countByEventType("LOGOUT")).isGreaterThan(before);
    }

    @Test
    void refresh_writesAuditTokenRefresh_withoutRefreshToken() throws Exception {
        String refreshToken = loginAndGetRefreshToken();
        int before = countByEventType("TOKEN_REFRESH");

        mockMvc.perform(post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
            .andExpect(status().isOk());

        assertThat(countByEventType("TOKEN_REFRESH")).isGreaterThan(before);

        // Refresh token value must not appear in any audit field
        Integer withToken = jdbc.queryForObject(
            "SELECT COUNT(*) FROM audit_logs WHERE event_type = 'TOKEN_REFRESH' AND " +
            "(target_id = ? OR user_agent = ?)",
            Integer.class, refreshToken, refreshToken);
        assertThat(withToken).isZero();
    }

    @Test
    void fileUpload_writesAuditFileUpload_withoutStorageKey() throws Exception {
        String token = loginAndGetAccessToken();
        int before = countByEventType("FILE_UPLOAD");

        MvcResult result = mockMvc.perform(multipart("/api/v1/files/upload")
                .file(new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes()))
                .param("category", "DOCUMENT")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isCreated())
            .andReturn();

        assertThat(countByEventType("FILE_UPLOAD")).isGreaterThan(before);

        // targetId should be file UUID, not storageKey (which contains category/UUID.ext)
        String fileId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
        Integer countWithFileId = jdbc.queryForObject(
            "SELECT COUNT(*) FROM audit_logs WHERE event_type = 'FILE_UPLOAD' AND target_id = ?",
            Integer.class, fileId);
        assertThat(countWithFileId).isGreaterThanOrEqualTo(1);

        // storageKey pattern (contains '/') must not appear in target_id
        Integer withStorageKey = jdbc.queryForObject(
            "SELECT COUNT(*) FROM audit_logs WHERE event_type = 'FILE_UPLOAD' AND target_id LIKE '%/%'",
            Integer.class);
        assertThat(withStorageKey).isZero();
    }

    @Test
    void downloadUrl_writesAuditFileDownloadUrlCreated_withoutSignedUrl() throws Exception {
        String token = loginAndGetAccessToken();

        // Upload first
        MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/files/upload")
                .file(new MockMultipartFile("file", "report.txt", "text/plain", "data".getBytes()))
                .param("category", "DOCUMENT")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isCreated())
            .andReturn();
        String fileId = objectMapper.readTree(uploadResult.getResponse().getContentAsString()).get("id").asText();

        int before = countByEventType("FILE_DOWNLOAD_URL_CREATED");

        MvcResult urlResult = mockMvc.perform(get("/api/v1/files/" + fileId + "/download-url")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();

        assertThat(countByEventType("FILE_DOWNLOAD_URL_CREATED")).isGreaterThan(before);

        // Signed URL must not appear in any audit_logs row (never log the URL)
        String signedUrl = objectMapper.readTree(urlResult.getResponse().getContentAsString()).get("url").asText();
        Integer withSignedUrl = jdbc.queryForObject(
            "SELECT COUNT(*) FROM audit_logs WHERE event_type = 'FILE_DOWNLOAD_URL_CREATED' AND target_id = ?",
            Integer.class, signedUrl);
        assertThat(withSignedUrl).isZero();

        // targetId is the file UUID
        Integer withFileId = jdbc.queryForObject(
            "SELECT COUNT(*) FROM audit_logs WHERE event_type = 'FILE_DOWNLOAD_URL_CREATED' AND target_id = ?",
            Integer.class, fileId);
        assertThat(withFileId).isGreaterThanOrEqualTo(1);
    }

    @Test
    void adminPing_writesAuditAdminAccess() throws Exception {
        // Create admin user for this test
        String adminEmail = factory.uniqueEmail();
        Permission adminPerm = factory.createPermissionExact("admin.access");
        Role adminRole = factory.createRoleWithPermission("admin", adminPerm);
        factory.createUserWithRole(adminEmail, password, adminRole);

        String token = loginAndGetToken(adminEmail, password);
        int before = countByEventType("ADMIN_ACCESS");

        mockMvc.perform(get("/api/v1/admin/ping")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());

        assertThat(countByEventType("ADMIN_ACCESS")).isGreaterThan(before);
    }

    // --- helpers ---

    private int countByEventType(String eventType) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM audit_logs WHERE event_type = ?",
            Integer.class, eventType);
        return count != null ? count : 0;
    }

    private UUID userIdForEmail(String email) {
        return jdbc.queryForObject(
            "SELECT id FROM users WHERE email = ?", UUID.class, email);
    }

    private String loginAndGetAccessToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson(email, password)))
            .andExpect(status().isOk())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
            .get("accessToken").asText();
    }

    private String loginAndGetRefreshToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson(email, password)))
            .andExpect(status().isOk())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
            .get("refreshToken").asText();
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson(email, password)))
            .andExpect(status().isOk())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
            .get("accessToken").asText();
    }

    private String loginJson(String email, String password) {
        return String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password);
    }
}
