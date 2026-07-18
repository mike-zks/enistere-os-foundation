package com.enistere.core.modules.admin;

import com.enistere.core.AbstractIntegrationTest;
import com.enistere.core.TestDataFactory;
import com.enistere.core.modules.permissions.Permission;
import com.enistere.core.modules.roles.Role;
import com.enistere.core.modules.users.User;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RbacIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private TestDataFactory factory;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String adminEmail;
    private String userEmail;
    private final String password = "test-rbac-password";

    @BeforeEach
    void setUp() {
        // Admin user: has admin.access permission
        adminEmail = factory.uniqueEmail();
        Permission adminAccess = factory.createPermissionExact("admin.access");
        Role adminRole = factory.createRoleWithPermission("admin", adminAccess);
        factory.createUserWithRole(adminEmail, password, adminRole);

        // Regular user: no special permissions
        userEmail = factory.uniqueEmail();
        factory.createUser(userEmail, password);
    }

    @Test
    void adminPing_withAdminUser_returns200() throws Exception {
        String token = loginAndGetToken(adminEmail);
        mockMvc.perform(get("/api/v1/admin/ping")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("ok"))
            .andExpect(jsonPath("$.scope").value("admin"));
    }

    @Test
    void adminPing_withRegularUser_returns403() throws Exception {
        String token = loginAndGetToken(userEmail);
        mockMvc.perform(get("/api/v1/admin/ping")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isForbidden());
    }

    @Test
    void adminPing_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/ping"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void me_adminUser_includesAdminPermission() throws Exception {
        String token = loginAndGetToken(adminEmail);
        mockMvc.perform(get("/api/v1/auth/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(adminEmail))
            .andExpect(jsonPath("$.permissions").isArray())
            .andExpect(jsonPath("$.permissions[0]").value("admin.access"));
    }

    @Test
    void me_regularUser_hasNoPermissions() throws Exception {
        String token = loginAndGetToken(userEmail);
        mockMvc.perform(get("/api/v1/auth/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.permissions").isArray())
            .andExpect(jsonPath("$.permissions").isEmpty());
    }

    private String loginAndGetToken(String email) throws Exception {
        String body = String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password);
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
            .get("accessToken").asText();
    }
}
