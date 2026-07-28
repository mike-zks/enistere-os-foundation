package com.enistere.core.modules.authorization;

import com.enistere.core.AbstractIntegrationTest;
import com.enistere.core.TestDataFactory;
import com.enistere.core.modules.audit.AuditLog;
import com.enistere.core.modules.audit.AuditLogRepository;
import com.enistere.core.modules.permissions.Permission;
import com.enistere.core.modules.permissions.PermissionRepository;
import com.enistere.core.modules.roles.Role;
import com.enistere.core.modules.roles.RoleRepository;
import com.enistere.core.modules.users.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import({ AuthorizationIntegrationTest.ProtectedProbe.class, AuthorizationIntegrationTest.ProtectedEndpoint.class })
class AuthorizationIntegrationTest extends AbstractIntegrationTest {

    @Autowired private TestDataFactory factory;
    @Autowired private RoleRepository roleRepository;
    @Autowired private PermissionRepository permissionRepository;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private ProtectedProbe protectedProbe;
    @Autowired private AuditLogRepository auditLogRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private String email;
    private String password;
    private User user;

    @BeforeEach
    void createUser() {
        email = factory.uniqueEmail();
        password = "test-password-123";
        user = factory.createUser(email, password);
    }

    @Test
    void authorization_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me/authorization"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void authorization_withoutAssignments_returnsEmptySummary() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me/authorization")
                .header("Authorization", "Bearer " + loginAndGetAccessToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.roles").isEmpty())
            .andExpect(jsonPath("$.permissions").isEmpty());
    }

    @Test
    void authorization_returnsSortedEffectiveCodesWithoutInternalFields() throws Exception {
        assign("operator", "files.write");
        assign("administrator", "files.read");

        MvcResult result = mockMvc.perform(get("/api/v1/auth/me/authorization")
                .header("Authorization", "Bearer " + loginAndGetAccessToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.roles[0]").value("administrator"))
            .andExpect(jsonPath("$.roles[1]").value("operator"))
            .andExpect(jsonPath("$.permissions[0]").value("files.read"))
            .andExpect(jsonPath("$.permissions[1]").value("files.write"))
            .andReturn();

        String body = result.getResponse().getContentAsString();
        assertThat(body).doesNotContain("userId", "roleId", "permissionId", "description");
    }

    @Test
    void methodSecurityUsesCurrentServerSidePermissionAndDeniesByDefault() {
        setAuthentication();
        assertThatThrownBy(protectedProbe::readFiles).isInstanceOf(AccessDeniedException.class);

        assign("reader", "files.read");
        assertThatCode(protectedProbe::readFiles).doesNotThrowAnyException();

        SecurityContextHolder.clearContext();
    }

    @Test
    void denial_overHttp_returnsGenericForbiddenWithoutRevealingTheGrant() throws Exception {
        String token = loginAndGetAccessToken();
        MvcResult result = mockMvc.perform(get("/api/v1/test-authz/needs-files-read")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.statusCode").value(403))
            .andExpect(jsonPath("$.errorCode").value("AUTH_FORBIDDEN"))
            .andReturn();
        // The refusal must not name the grant that would have unlocked the route.
        assertThat(result.getResponse().getContentAsString()).doesNotContain("files.read");
    }

    @Test
    void grant_takesEffectImmediatelyOnTheSameToken() throws Exception {
        String token = loginAndGetAccessToken();
        mockMvc.perform(get("/api/v1/test-authz/needs-files-read")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isForbidden());

        assign("reader", "files.read");

        // Same token, no re-login: the decision follows server state, not the JWT.
        mockMvc.perform(get("/api/v1/test-authz/needs-files-read")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());
    }

    @Test
    void denial_isRecordedAsBusinessAuditEvent() throws Exception {
        auditLogRepository.deleteAll();
        String token = loginAndGetAccessToken();
        mockMvc.perform(get("/api/v1/test-authz/needs-files-read")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isForbidden());

        List<AuditLog> logs = auditLogRepository.findAll();
        assertThat(logs).extracting(AuditLog::getEventType).contains("AUTHORIZATION_DENIED");
        // The trail records where it happened, never which grant was missing.
        assertThat(logs)
            .filteredOn(entry -> "AUTHORIZATION_DENIED".equals(entry.getEventType()))
            .allSatisfy(entry -> assertThat(entry.getTargetId()).doesNotContain("files.read"));
    }

    private void assign(String roleName, String permissionName) {
        Role role = roleRepository.findByName(roleName).orElseGet(() -> {
            Role value = new Role();
            value.setName(roleName);
            return roleRepository.save(value);
        });
        Permission permission = permissionRepository.findByName(permissionName).orElseGet(() -> {
            Permission value = new Permission();
            value.setName(permissionName);
            return permissionRepository.save(value);
        });

        jdbcTemplate.update(
            "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
            user.getId(), role.getId()
        );
        jdbcTemplate.update(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
            role.getId(), permission.getId()
        );
    }

    private void setAuthentication() {
        var authentication = new UsernamePasswordAuthenticationToken(email, null, List.of());
        authentication.setDetails(user.getId().toString());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private String loginAndGetAccessToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password)))
            .andExpect(status().isOk())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    static class ProtectedProbe {
        @PreAuthorize("@rbacAuthorization.hasPermission(authentication, 'files.read')")
        public void readFiles() {
        }
    }

    /** Real HTTP surface: proves what a caller actually observes when denied. */
    @RestController
    static class ProtectedEndpoint {
        @GetMapping("/api/v1/test-authz/needs-files-read")
        @PreAuthorize("@rbacAuthorization.hasPermission(authentication, 'files.read')")
        public String needsFilesRead() {
            return "granted";
        }
    }
}
