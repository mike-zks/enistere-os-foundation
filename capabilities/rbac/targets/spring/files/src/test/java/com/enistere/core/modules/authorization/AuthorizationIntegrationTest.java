package com.enistere.core.modules.authorization;

import com.enistere.core.AbstractIntegrationTest;
import com.enistere.core.TestDataFactory;
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

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(AuthorizationIntegrationTest.ProtectedProbe.class)
class AuthorizationIntegrationTest extends AbstractIntegrationTest {

    @Autowired private TestDataFactory factory;
    @Autowired private RoleRepository roleRepository;
    @Autowired private PermissionRepository permissionRepository;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private ProtectedProbe protectedProbe;

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
}
