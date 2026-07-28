package com.enistere.core.modules.files;

import com.enistere.core.AbstractIntegrationTest;
import com.enistere.core.TestDataFactory;
import com.enistere.core.config.FilesConfig;
import com.enistere.core.infrastructure.storage.MinioStorageService;
import com.enistere.core.infrastructure.storage.StorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.minio.BucketExistsArgs;
import io.minio.ListObjectsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.Result;
import io.minio.messages.Item;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(MinioStorageIntegrationTest.MinioTestConfig.class)
class MinioStorageIntegrationTest extends AbstractIntegrationTest {

    static final String MINIO_ACCESS_KEY = "minio-tc-access";
    static final String MINIO_SECRET_KEY = "minio-tc-secret";
    static final String TEST_BUCKET = "enistere-tc-test";

    static final GenericContainer<?> MINIO = new GenericContainer<>("minio/minio:RELEASE.2024-01-16T16-07-38Z")
        .withExposedPorts(9000)
        .withEnv("MINIO_ROOT_USER", MINIO_ACCESS_KEY)
        .withEnv("MINIO_ROOT_PASSWORD", MINIO_SECRET_KEY)
        .withCommand("server", "/data")
        .waitingFor(Wait.forHttp("/minio/health/live").forStatusCode(200));

    static MinioClient testMinioClient;

    static {
        MINIO.start();
        try {
            testMinioClient = MinioClient.builder()
                .endpoint("http://localhost:" + MINIO.getMappedPort(9000))
                .credentials(MINIO_ACCESS_KEY, MINIO_SECRET_KEY)
                .build();
            if (!testMinioClient.bucketExists(BucketExistsArgs.builder().bucket(TEST_BUCKET).build())) {
                testMinioClient.makeBucket(MakeBucketArgs.builder().bucket(TEST_BUCKET).build());
            }
        } catch (Exception e) {
            throw new RuntimeException("MinIO TC setup failed", e);
        }
    }

    @DynamicPropertySource
    static void minioProperties(DynamicPropertyRegistry registry) {
        String endpoint = "http://localhost:" + MINIO.getMappedPort(9000);
        registry.add("enistere.files.endpoint", () -> endpoint);
        registry.add("enistere.files.access-key", () -> MINIO_ACCESS_KEY);
        registry.add("enistere.files.secret-key", () -> MINIO_SECRET_KEY);
        registry.add("enistere.files.bucket", () -> TEST_BUCKET);
    }

    @Autowired
    private TestDataFactory factory;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private String token;

    @BeforeEach
    void setup() throws Exception {
        String email = factory.uniqueEmail();
        String password = "minio-tc-test-pwd-2026";
        com.enistere.core.modules.users.User user = factory.createUser(email, password);
        FilesTestAccess.grant(jdbcTemplate, user.getId(), "files.upload", "files.download");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password)))
            .andExpect(status().isOk())
            .andReturn();
        token = objectMapper.readTree(loginResult.getResponse().getContentAsString())
            .get("accessToken").asText();
    }

    @Test
    void upload_toRealMinio_objectExistsInBucket() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
            "file", "integration.txt", "text/plain", "real minio content".getBytes());

        mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file)
                .param("category", "DOCUMENT")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNotEmpty());

        Iterable<Result<Item>> objects = testMinioClient.listObjects(
            ListObjectsArgs.builder().bucket(TEST_BUCKET).build());
        assertThat(objects.iterator().hasNext()).isTrue();
    }

    @Test
    void downloadUrl_fromRealMinio_isPresignedUrlNotFake() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
            "file", "report.txt", "text/plain", "report data".getBytes());

        MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file)
                .param("category", "DOCUMENT")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isCreated())
            .andReturn();
        String fileId = objectMapper.readTree(uploadResult.getResponse().getContentAsString())
            .get("id").asText();

        MvcResult urlResult = mockMvc.perform(get("/api/v1/files/" + fileId + "/download-url")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.fileId").value(fileId))
            .andExpect(jsonPath("$.url").isNotEmpty())
            .andReturn();

        String url = objectMapper.readTree(urlResult.getResponse().getContentAsString())
            .get("url").asText();
        assertThat(url).doesNotContain("fake-storage.test");
        assertThat(url).contains("X-Amz-");
    }

    @Test
    void downloadUrl_fromRealMinio_hasNoCacheHeader() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
            "file", "doc.txt", "text/plain", "document".getBytes());

        MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/files/upload")
                .file(file)
                .param("category", "DOCUMENT")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isCreated())
            .andReturn();
        String fileId = objectMapper.readTree(uploadResult.getResponse().getContentAsString())
            .get("id").asText();

        mockMvc.perform(get("/api/v1/files/" + fileId + "/download-url")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andExpect(header().string("Cache-Control", "no-store"));
    }

    @TestConfiguration
    static class MinioTestConfig {
        @Bean
        @Primary
        StorageService minioStorageService(FilesConfig filesConfig) {
            MinioClient client = MinioClient.builder()
                .endpoint(filesConfig.getEndpoint())
                .credentials(filesConfig.getAccessKey(), filesConfig.getSecretKey())
                .build();
            return new MinioStorageService(client, filesConfig);
        }
    }
}
