package com.enistere.core.modules.auth.security;

import com.enistere.core.modules.auth.JwtConfig;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey signingKey;
    private final long expirationSeconds;

    public JwtTokenProvider(JwtConfig config) {
        this.signingKey = Keys.hmacShaKeyFor(config.getSecret().getBytes(StandardCharsets.UTF_8));
        this.expirationSeconds = config.getExpiration();
    }

    public String generateAccessToken(String email, String userId) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
            .subject(email)
            .claim("userId", userId)
            .issuedAt(new Date(now))
            .expiration(new Date(now + expirationSeconds * 1000L))
            .signWith(signingKey)
            .compact();
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public String extractSubject(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractUserId(String token) {
        return extractAllClaims(token).get("userId", String.class);
    }

    public boolean validateToken(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
