package com.enistere.core.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CorsConfigTest {

    @Test
    void trimsOriginsAndRejectsWildcardsBeforeCredentialsAreEnabled() {
        CorsConfig config = new CorsConfig();
        config.setAllowedOrigins(" https://customer.example , *, https://admin.example ");

        assertEquals(
            java.util.List.of("https://customer.example", "https://admin.example"),
            config.getAllowedOriginsList());
    }
}
