package com.enistere.core.infrastructure.security;

import com.enistere.core.config.JwtConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private JwtTokenProvider provider;

    @BeforeEach
    void setUp() {
        JwtConfig config = new JwtConfig();
        config.setSecret("test-jwt-secret-for-junit-only-not-for-production-min32c");
        config.setExpiration(60L);
        provider = new JwtTokenProvider(config);
    }

    @Test
    void generateToken_returnsNonBlankJwt() {
        String token = provider.generateAccessToken("user@test.com", UUID.randomUUID().toString());
        assertThat(token).isNotBlank();
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Test
    void validateToken_validToken_returnsTrue() {
        String token = provider.generateAccessToken("user@test.com", UUID.randomUUID().toString());
        assertThat(provider.validateToken(token)).isTrue();
    }

    @Test
    void extractSubject_returnsEmail() {
        String token = provider.generateAccessToken("user@test.com", UUID.randomUUID().toString());
        assertThat(provider.extractSubject(token)).isEqualTo("user@test.com");
    }

    @Test
    void extractUserId_returnsUserId() {
        String userId = UUID.randomUUID().toString();
        String token = provider.generateAccessToken("user@test.com", userId);
        assertThat(provider.extractUserId(token)).isEqualTo(userId);
    }

    @Test
    void validateToken_malformedToken_returnsFalse() {
        assertThat(provider.validateToken("not.a.valid.jwt")).isFalse();
    }

    @Test
    void validateToken_emptyToken_returnsFalse() {
        assertThat(provider.validateToken("")).isFalse();
    }

    @Test
    void validateToken_tokenWithWrongSignature_returnsFalse() {
        String token = provider.generateAccessToken("user@test.com", UUID.randomUUID().toString());
        String tampered = token.substring(0, token.lastIndexOf('.') + 1) + "invalidsignature";
        assertThat(provider.validateToken(tampered)).isFalse();
    }
}
