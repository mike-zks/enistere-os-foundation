package com.enistere.core.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI enistereOpenApi() {
        return new OpenAPI()
            .info(new Info()
                .title("Enistere API Core")
                .version("0.1.0")
                .description("Spring Boot 4 — auth, RBAC, files socle. " +
                    "Statut : IMPLEMENTATION_PARTIELLE / FILE_UPLOAD_READY"))
            .addSecurityItem(new SecurityRequirement().addList("Bearer"))
            .components(new Components()
                .addSecuritySchemes("Bearer", new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("bearer")
                    .bearerFormat("JWT")
                    .description("JWT access token (15 min)")));
    }
}
