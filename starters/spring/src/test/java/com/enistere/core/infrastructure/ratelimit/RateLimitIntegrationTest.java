package com.enistere.core.infrastructure.ratelimit;

import com.enistere.core.AbstractIntegrationTest;
import com.enistere.core.TestDataFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = {
    "enistere.security.rate-limit.enabled=true",
    "enistere.security.rate-limit.auth-capacity=2",
    "enistere.security.rate-limit.auth-refill-seconds=3600",
    "enistere.security.rate-limit.upload-capacity=1",
    "enistere.security.rate-limit.upload-refill-seconds=3600",
    "enistere.security.rate-limit.download-url-capacity=1",
    "enistere.security.rate-limit.download-url-refill-seconds=3600"
})
class RateLimitIntegrationTest extends AbstractIntegrationTest {

    @Autowired(required = false)
    private RateLimitInterceptor rateLimitInterceptor;

    @Autowired
    private TestDataFactory factory;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private String email;
    private final String password = "rate-limit-test-pwd-2026";

    @BeforeEach
    void setup() {
        email = factory.uniqueEmail();
        factory.createUser(email, password);
        if (rateLimitInterceptor != null) {
            rateLimitInterceptor.clearWindows();
        }
    }

    @Test
    void login_afterCapacityExceeded_returns429WithApiError() throws Exception {
        String body = loginJson(email, password);
        // auth-capacity=2: first two succeed
        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isOk());
        // third request hits limit
        mockMvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.status").value(429))
            .andExpect(jsonPath("$.code").value("TOO_MANY_REQUESTS"));
    }

    @Test
    void upload_afterCapacityExceeded_returns429() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "hello".getBytes());

        // upload-capacity=1: first succeeds
        mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file)
                .param("category", "DOCUMENT")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isCreated());

        // second hits limit
        mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file)
                .param("category", "DOCUMENT")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.status").value(429));
    }

    @Test
    void downloadUrl_afterCapacityExceeded_returns429() throws Exception {
        String token = loginAndGetToken();
        String fileId = uploadFileAndGetId(token);

        // download-url-capacity=1: first succeeds
        mockMvc.perform(get("/api/v1/files/" + fileId + "/download-url")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());

        // second hits limit
        mockMvc.perform(get("/api/v1/files/" + fileId + "/download-url")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.status").value(429));
    }

    @Test
    void actuatorHealth_isNotRateLimited() throws Exception {
        // /actuator/health is not in the rate-limited path list
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
        }
    }

    // --- helpers ---

    private String loginAndGetToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson(email, password)))
            .andExpect(status().isOk())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
            .get("accessToken").asText();
    }

    private String uploadFileAndGetId(String token) throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "doc.txt", "text/plain", "data".getBytes());
        MvcResult result = mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file)
                .param("category", "DOCUMENT")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isCreated())
            .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String loginJson(String email, String password) {
        return String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password);
    }
}
