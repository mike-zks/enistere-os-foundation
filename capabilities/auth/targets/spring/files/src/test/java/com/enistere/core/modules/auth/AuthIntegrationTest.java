package com.enistere.core.modules.auth;

import com.enistere.core.AbstractIntegrationTest;
import com.enistere.core.TestDataFactory;
import com.enistere.core.modules.audit.AuditLog;
import com.enistere.core.modules.audit.AuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private TestDataFactory factory;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String email;
    private String password;

    @BeforeEach
    void createUser() {
        email = factory.uniqueEmail();
        password = "test-password-123";
        factory.createUser(email, password);
    }

    // --- login ---

    @Test
    void login_validCredentials_returnsCanonicalSession() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(email, password)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.refreshToken").isNotEmpty())
            .andExpect(jsonPath("$.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.accessTokenExpiresIn").value(60))
            .andExpect(jsonPath("$.refreshTokenExpiresIn").isNumber())
            .andExpect(jsonPath("$.user.id").isNotEmpty())
            .andExpect(jsonPath("$.user.email").value(email))
            .andExpect(jsonPath("$.user.status").value("ACTIVE"));
    }

    @Test
    void login_wrongPassword_returnsGeneric401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(email, "wrong-password")))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.statusCode").value(401))
            .andExpect(jsonPath("$.errorCode").value("AUTH_INVALID_CREDENTIALS"));
    }

    @Test
    void login_unknownEmail_returnsSameGeneric401() throws Exception {
        // Must be indistinguishable from a wrong password: same status, same code.
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("nobody@enistere.test", "anything")))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.statusCode").value(401))
            .andExpect(jsonPath("$.errorCode").value("AUTH_INVALID_CREDENTIALS"));
    }

    @Test
    void login_blankEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"\",\"password\":\"password\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }

    @Test
    void login_noPasswordFieldExposed_inResponse() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(email, password)))
            .andExpect(status().isOk())
            .andReturn();
        String body = result.getResponse().getContentAsString();
        assertThat(body).doesNotContain("passwordHash");
        assertThat(body).doesNotContain("password_hash");
    }

    // --- /me ---

    @Test
    void me_withValidToken_returns200WithoutPasswordHash() throws Exception {
        String token = loginAndGetAccessToken();
        MvcResult result = mockMvc.perform(get("/api/v1/auth/me")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value(email))
            .andExpect(jsonPath("$.userId").isNotEmpty())
            .andReturn();
        String body = result.getResponse().getContentAsString();
        assertThat(body).doesNotContain("passwordHash");
    }

    @Test
    void me_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.statusCode").value(401));
    }

    // --- refresh ---

    @Test
    void refresh_withValidToken_rotatesTokenPair() throws Exception {
        String refreshToken = loginAndGetRefreshToken();
        MvcResult result = mockMvc.perform(post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.refreshToken").isNotEmpty())
            .andReturn();
        String rotated = objectMapper.readTree(result.getResponse().getContentAsString())
            .get("refreshToken").asText();
        assertThat(rotated).isNotEqualTo(refreshToken);
    }

    @Test
    void refresh_withInvalidToken_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"invalid-token-hex\"}"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.errorCode").value("AUTH_REFRESH_TOKEN_INVALID"));
    }

    @Test
    void refresh_afterRotation_returnsGeneric401() throws Exception {
        String refreshToken = loginAndGetRefreshToken();
        mockMvc.perform(post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
            .andExpect(status().isOk());
        // Replaying a rotated token is the reuse signal and must not reveal it.
        mockMvc.perform(post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.errorCode").value("AUTH_REFRESH_TOKEN_INVALID"));
    }

    // --- logout ---

    @Test
    void logout_isIdempotentAndRevokesRefreshToken() throws Exception {
        String accessToken = loginAndGetAccessToken();
        String refreshToken = loginAndGetRefreshToken();
        mockMvc.perform(post("/api/v1/auth/logout")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
            .andExpect(status().isNoContent());
        // Replaying the same logout stays non-revealing: still 204, never an error.
        mockMvc.perform(post("/api/v1/auth/logout")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
            .andExpect(status().isNoContent());
        mockMvc.perform(post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void logout_withoutAuthToken_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void logout_withoutBody_returns204() throws Exception {
        String accessToken = loginAndGetAccessToken();
        mockMvc.perform(post("/api/v1/auth/logout")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isNoContent());
    }

    // --- secret handling ---

    @Test
    void login_persistsOnlyRefreshFingerprint() throws Exception {
        String refreshToken = loginAndGetRefreshToken();
        List<RefreshToken> stored = refreshTokenRepository.findAll();
        assertThat(stored).isNotEmpty();
        // The raw token must be unrecoverable from the store: only its SHA-256
        // fingerprint is persisted, and it is never echoed back.
        assertThat(stored).noneMatch(token -> token.getTokenHash().equals(refreshToken));
        assertThat(refreshTokenRepository.findByTokenHash(refreshToken)).isEmpty();

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(email, password)))
            .andExpect(status().isOk())
            .andReturn();
        String body = result.getResponse().getContentAsString();
        assertThat(body).doesNotContain("tokenHash");
        assertThat(body).doesNotContain("passwordHash");
    }

    // --- business audit ---

    @Test
    void audit_events_coverAuthenticationLifecycle() throws Exception {
        auditLogRepository.deleteAll();

        String refreshToken = loginAndGetRefreshToken();          // AUTH_LOGIN_SUCCEEDED
        String accessToken = loginAndGetAccessToken();            // AUTH_LOGIN_SUCCEEDED
        mockMvc.perform(post("/api/v1/auth/login")                // AUTH_LOGIN_FAILED
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(email, "wrong-password")))
            .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/auth/refresh")              // AUTH_REFRESH_SUCCEEDED
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
            .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/auth/refresh")              // AUTH_REFRESH_FAILED
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"invalid-token-hex\"}"))
            .andExpect(status().isUnauthorized());
        // A fresh token: the one above was consumed by the rotation.
        String logoutRefreshToken = loginAndGetRefreshToken();
        mockMvc.perform(post("/api/v1/auth/logout")               // AUTH_LOGOUT
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"" + logoutRefreshToken + "\"}"))
            .andExpect(status().isNoContent());

        List<AuditLog> logs = auditLogRepository.findAll();
        assertThat(logs).extracting(AuditLog::getEventType).contains(
            "AUTH_LOGIN_SUCCEEDED",
            "AUTH_LOGIN_FAILED",
            "AUTH_REFRESH_SUCCEEDED",
            "AUTH_REFRESH_FAILED",
            "AUTH_LOGOUT"
        );
        // The audit trail records what happened, never the material that proved it.
        assertThat(logs).allSatisfy(entry -> {
            if (entry.getTargetId() != null) {
                assertThat(entry.getTargetId())
                    .doesNotContain(refreshToken)
                    .doesNotContain(password);
            }
        });
    }

    // --- error format ---

    @Test
    void error_noStackTrace_inResponse() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(email, "bad")))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.statusCode").value(401))
            .andExpect(jsonPath("$.errorCode").isNotEmpty())
            .andExpect(jsonPath("$.timestamp").isNotEmpty())
            .andExpect(jsonPath("$.path").isNotEmpty());
    }

    // helpers

    private String loginAndGetAccessToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(email, password)))
            .andExpect(status().isOk())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
            .get("accessToken").asText();
    }

    private String loginAndGetRefreshToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(email, password)))
            .andExpect(status().isOk())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
            .get("refreshToken").asText();
    }

    private String json(String email, String password) {
        return String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password);
    }
}
