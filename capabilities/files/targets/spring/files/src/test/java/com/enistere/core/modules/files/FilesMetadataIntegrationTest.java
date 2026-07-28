package com.enistere.core.modules.files;

import com.enistere.core.AbstractIntegrationTest;
import com.enistere.core.TestDataFactory;
import com.enistere.core.modules.users.User;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Metadata responsibility: owned listing and single-file lookup, at parity with
 * the NestJS authority.
 */
class FilesMetadataIntegrationTest extends AbstractIntegrationTest {

    @Autowired private TestDataFactory factory;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private StoredFileRepository repository;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private String ownerEmail;
    private String otherEmail;
    private final String password = "metadata-test-pwd";

    @BeforeEach
    void setup() {
        ownerEmail = factory.uniqueEmail();
        otherEmail = factory.uniqueEmail();
        User owner = factory.createUser(ownerEmail, password);
        User other = factory.createUser(otherEmail, password);
        FilesTestAccess.grant(jdbcTemplate, owner.getId(), "files.upload", "files.read");
        FilesTestAccess.grant(jdbcTemplate, other.getId(), "files.upload", "files.read");
    }

    @Test
    void list_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/files"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void list_withoutReadPermission_returns403() throws Exception {
        String strangerEmail = factory.uniqueEmail();
        User stranger = factory.createUser(strangerEmail, password);
        FilesTestAccess.grant(jdbcTemplate, stranger.getId(), "files.upload");

        mockMvc.perform(get("/api/v1/files")
                .header("Authorization", "Bearer " + loginAndGetToken(strangerEmail)))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.errorCode").value("AUTH_FORBIDDEN"));
    }

    @Test
    void list_withoutFiles_returnsEmptyPage() throws Exception {
        mockMvc.perform(get("/api/v1/files")
                .header("Authorization", "Bearer " + loginAndGetToken(ownerEmail)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items").isArray())
            .andExpect(jsonPath("$.items").isEmpty())
            .andExpect(jsonPath("$.total").value(0))
            .andExpect(jsonPath("$.nextOffset").doesNotExist());
    }

    @Test
    void list_returnsOnlyOwnedFiles_ownershipIsolation() throws Exception {
        String ownerToken = loginAndGetToken(ownerEmail);
        String otherToken = loginAndGetToken(otherEmail);
        upload(ownerToken, "owned.txt");
        upload(otherToken, "foreign.txt");

        MvcResult result = mockMvc.perform(get("/api/v1/files")
                .header("Authorization", "Bearer " + ownerToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(1))
            .andReturn();
        assertThat(result.getResponse().getContentAsString()).doesNotContain("foreign.txt");
    }

    @Test
    void list_excludesDeletedFiles() throws Exception {
        String token = loginAndGetToken(ownerEmail);
        String keptId = upload(token, "kept.txt");
        String goneId = upload(token, "gone.txt");

        StoredFile gone = repository.findById(java.util.UUID.fromString(goneId)).orElseThrow();
        gone.setStatus(FileStatus.DELETED);
        repository.save(gone);

        MvcResult result = mockMvc.perform(get("/api/v1/files")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(1))
            .andReturn();
        String body = result.getResponse().getContentAsString();
        assertThat(body).contains(keptId).doesNotContain(goneId);
    }

    @Test
    void list_isOrderedNewestFirst_andPaginates() throws Exception {
        String token = loginAndGetToken(ownerEmail);
        String first = upload(token, "a.txt");
        String second = upload(token, "b.txt");
        String third = upload(token, "c.txt");

        // Page 1 of 2: newest first, and nextOffset points at the remainder.
        MvcResult page1 = mockMvc.perform(get("/api/v1/files")
                .param("limit", "2").param("offset", "0")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(3))
            .andExpect(jsonPath("$.nextOffset").value(2))
            .andReturn();
        JsonNode items = objectMapper.readTree(page1.getResponse().getContentAsString()).get("items");
        assertThat(items).hasSize(2);
        assertThat(items.get(0).get("id").asText()).isEqualTo(third);
        assertThat(items.get(1).get("id").asText()).isEqualTo(second);

        // Last page closes the cursor rather than leaving the client to infer it.
        mockMvc.perform(get("/api/v1/files")
                .param("limit", "2").param("offset", "2")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items.length()").value(1))
            .andExpect(jsonPath("$.items[0].id").value(first))
            .andExpect(jsonPath("$.nextOffset").doesNotExist());
    }

    @Test
    void list_invalidPagination_returns400() throws Exception {
        String token = loginAndGetToken(ownerEmail);
        mockMvc.perform(get("/api/v1/files").param("limit", "0")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/files").param("limit", "51")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/files").param("offset", "-1")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isBadRequest());
    }

    @Test
    void list_doesNotLeakInternalFields() throws Exception {
        String token = loginAndGetToken(ownerEmail);
        upload(token, "secret.txt");

        MvcResult result = mockMvc.perform(get("/api/v1/files")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();
        String body = result.getResponse().getContentAsString();
        assertThat(body)
            .doesNotContain("storageKey").doesNotContain("storage_key")
            .doesNotContain("bucket").doesNotContain("ownerId").doesNotContain("owner_id");
    }

    @Test
    void metadata_ofOwnedFile_returnsPublicFieldsOnly() throws Exception {
        String token = loginAndGetToken(ownerEmail);
        String id = upload(token, "mine.txt");

        MvcResult result = mockMvc.perform(get("/api/v1/files/" + id)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(id))
            .andExpect(jsonPath("$.originalName").value("mine.txt"))
            .andReturn();
        assertThat(result.getResponse().getContentAsString())
            .doesNotContain("storageKey").doesNotContain("bucket").doesNotContain("ownerId");
    }

    @Test
    void metadata_ofAnotherUserFile_returns404_antiEnumeration() throws Exception {
        String id = upload(loginAndGetToken(otherEmail), "not-yours.txt");

        // Must be indistinguishable from a file that never existed.
        mockMvc.perform(get("/api/v1/files/" + id)
                .header("Authorization", "Bearer " + loginAndGetToken(ownerEmail)))
            .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/files/00000000-0000-0000-0000-0000000000ff")
                .header("Authorization", "Bearer " + loginAndGetToken(ownerEmail)))
            .andExpect(status().isNotFound());
    }

    @Test
    void metadata_ofDeletedFile_returns404() throws Exception {
        String token = loginAndGetToken(ownerEmail);
        String id = upload(token, "removed.txt");
        StoredFile file = repository.findById(java.util.UUID.fromString(id)).orElseThrow();
        file.setStatus(FileStatus.DELETED);
        repository.save(file);

        mockMvc.perform(get("/api/v1/files/" + id)
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isNotFound());
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
