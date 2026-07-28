package com.enistere.core.config;

import io.minio.MinioClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.concurrent.TimeUnit;

@Configuration
@Profile("!test")
public class StorageConfig {

    @Bean
    public MinioClient minioClient(FilesConfig config) {
        MinioClient client = MinioClient.builder()
            .endpoint(config.getEndpoint())
            .credentials(config.getAccessKey(), config.getSecretKey())
            .build();

        // Without an explicit timeout the client waits indefinitely, so a slow or
        // unreachable object store pins the request thread for as long as it
        // takes — one storage incident becomes an API-wide outage. The write
        // budget is the largest because it carries the payload.
        client.setTimeout(
            TimeUnit.SECONDS.toMillis(config.getStorageConnectTimeoutSeconds()),
            TimeUnit.SECONDS.toMillis(config.getStorageWriteTimeoutSeconds()),
            TimeUnit.SECONDS.toMillis(config.getStorageReadTimeoutSeconds())
        );
        return client;
    }
}
