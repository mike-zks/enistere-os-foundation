package com.enistere.core.config;

import com.enistere.core.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CorsIntegrationTest extends AbstractIntegrationTest {

    @Test
    void cors_configuredOrigin_isAllowed() throws Exception {
        mockMvc.perform(options("/api/v1/auth/login")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    @Test
    void cors_unknownOrigin_isNotAllowed() throws Exception {
        mockMvc.perform(options("/api/v1/auth/login")
                .header("Origin", "https://evil.example.com")
                .header("Access-Control-Request-Method", "POST"))
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    void cors_wildcardsAreIgnoredBecauseCredentialsAreAllowed() {
        CorsConfig config = new CorsConfig();
        config.setAllowedOrigins("https://app.example.com, *, https://*.example.net");

        assertThat(config.getAllowedOriginsList()).containsExactly("https://app.example.com");
    }
}
