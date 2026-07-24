package com.enistere.core.modules.files;

import com.enistere.core.AbstractIntegrationTest;
import com.enistere.core.TestDataFactory;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FilesDownloadUrlIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private TestDataFactory factory;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private String ownerEmail;
    private String otherEmail;
    private final String password = "download-url-test-pwd";

    @BeforeEach
    void setup() {
        ownerEmail = factory.uniqueEmail();
        otherEmail = factory.uniqueEmail();
        factory.createUser(ownerEmail, password);
        factory.createUser(otherEmail, password);
    }

    @Test
    void downloadUrl_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/files/00000000-0000-0000-0000-000000000001/download-url"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.statusCode").value(401));
    }

    @Test
    void downloadUrl_asOwner_returns200WithUrlAndExpiresIn() throws Exception {
        String token = loginAndGetToken(ownerEmail);
        String fileId = uploadAndGetId(token);

        mockMvc.perform(get("/api/v1/files/" + fileId + "/download-url")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fileId").value(fileId))
            .andExpect(jsonPath("$.url").isNotEmpty())
            .andExpect(jsonPath("$.expiresIn").isNumber());
    }

    @Test
    void downloadUrl_responseHasNoCacheHeader() throws Exception {
        String token = loginAndGetToken(ownerEmail);
        String fileId = uploadAndGetId(token);

        mockMvc.perform(get("/api/v1/files/" + fileId + "/download-url")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(header().string("Cache-Control", "no-store"));
    }

    @Test
    void downloadUrl_asOtherUser_returns404_antiEnumeration() throws Exception {
        String ownerToken = loginAndGetToken(ownerEmail);
        String fileId = uploadAndGetId(ownerToken);

        String otherToken = loginAndGetToken(otherEmail);
        mockMvc.perform(get("/api/v1/files/" + fileId + "/download-url")
                .header("Authorization", "Bearer " + otherToken))
            .andExpect(status().isNotFound());
    }

    @Test
    void downloadUrl_nonExistentFile_returns404() throws Exception {
        String token = loginAndGetToken(ownerEmail);
        String randomId = "00000000-0000-0000-0000-000000000099";

        mockMvc.perform(get("/api/v1/files/" + randomId + "/download-url")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNotFound());
    }

    @Test
    void downloadUrl_responseDoesNotLeakInternalFields() throws Exception {
        String token = loginAndGetToken(ownerEmail);
        String fileId = uploadAndGetId(token);

        MvcResult result = mockMvc.perform(get("/api/v1/files/" + fileId + "/download-url")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();

        String body = result.getResponse().getContentAsString();
        assertThat(body).doesNotContain("storageKey");
        assertThat(body).doesNotContain("storage_key");
        assertThat(body).doesNotContain("bucket");
        assertThat(body).doesNotContain("ownerId");
        assertThat(body).doesNotContain("owner_id");
    }

    // --- helpers ---

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

    private String uploadAndGetId(String token) throws Exception {
        MockMultipartFile file = new MockMultipartFile(
            "file", "test.txt", "text/plain", "test content".getBytes());
        MvcResult result = mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file)
                .param("category", "DOCUMENT")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isCreated())
            .andReturn();
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.get("id").asText();
    }
}
