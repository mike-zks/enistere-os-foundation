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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FilesUploadIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private TestDataFactory factory;

    private final ObjectMapper objectMapper = new ObjectMapper()
        .findAndRegisterModules();

    private String email;
    private String password;

    @BeforeEach
    void setup() {
        email = factory.uniqueEmail();
        password = "upload-test-password";
        factory.createUser(email, password);
    }

    @Test
    void upload_withoutToken_returns401() throws Exception {
        MockMultipartFile file = textFile("hello.txt");
        mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file)
                .param("category", "DOCUMENT"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void upload_withValidToken_returns201AndPublicDtoOnly() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile file = textFile("report.txt");

        MvcResult result = mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file)
                .param("category", "DOCUMENT")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNotEmpty())
            .andExpect(jsonPath("$.originalName").isNotEmpty())
            .andExpect(jsonPath("$.contentType").value("text/plain"))
            .andExpect(jsonPath("$.size").isNumber())
            .andExpect(jsonPath("$.category").value("DOCUMENT"))
            .andExpect(jsonPath("$.createdAt").isNotEmpty())
            .andReturn();

        String body = result.getResponse().getContentAsString();
        assertNoInternalFieldsLeaked(body);
    }

    @Test
    void upload_responseDoesNotLeakInternalFields() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile file = pdfFile("doc.pdf");

        MvcResult result = mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file)
                .param("category", "DOCUMENT")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isCreated())
            .andReturn();

        assertNoInternalFieldsLeaked(result.getResponse().getContentAsString());
    }

    @Test
    void upload_missingCategory_returns400() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile file = textFile("test.txt");

        mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void upload_invalidCategory_returns400() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile file = textFile("test.txt");

        mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file)
                .param("category", "NOT_A_REAL_CATEGORY")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isBadRequest());
    }

    @Test
    void upload_blockedMimeType_returns415() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile file = new MockMultipartFile(
            "file", "script.js", "application/javascript", "alert(1)".getBytes());

        mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file)
                .param("category", "DOCUMENT")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void upload_emptyFile_returns400() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile file = new MockMultipartFile(
            "file", "empty.txt", "text/plain", new byte[0]);

        mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file)
                .param("category", "DOCUMENT")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isBadRequest());
    }

    @Test
    void upload_withSubjectId_returns201() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile file = textFile("attachment.txt");

        mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file)
                .param("category", "ATTACHMENT")
                .param("subjectId", "entity-42")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.category").value("ATTACHMENT"));
    }

    @Test
    void upload_subjectIdTooLong_returns400() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile file = textFile("test.txt");
        String tooLong = "x".repeat(129);

        mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file)
                .param("category", "DOCUMENT")
                .param("subjectId", tooLong)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isBadRequest());
    }

    // --- helpers ---

    private MockMultipartFile textFile(String filename) {
        return new MockMultipartFile("file", filename, "text/plain", "test content".getBytes());
    }

    private MockMultipartFile pdfFile(String filename) {
        return new MockMultipartFile("file", filename, "application/pdf", "%PDF-1.4 content".getBytes());
    }

    private String loginAndGetToken() throws Exception {
        String body = String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password);
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andReturn();
        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        return node.get("accessToken").asText();
    }

    private void assertNoInternalFieldsLeaked(String responseBody) {
        assertThat(responseBody).doesNotContain("storageKey");
        assertThat(responseBody).doesNotContain("storage_key");
        assertThat(responseBody).doesNotContain("bucket");
        assertThat(responseBody).doesNotContain("signedUrl");
        assertThat(responseBody).doesNotContain("signed_url");
        assertThat(responseBody).doesNotContain("ownerId");
        assertThat(responseBody).doesNotContain("owner_id");
        assertThat(responseBody).doesNotContain("passwordHash");
    }
}
