package com.enistere.core.modules.auth;

import com.enistere.core.config.JwtConfig;
import com.enistere.core.infrastructure.security.JwtTokenProvider;
import com.enistere.core.modules.auth.dto.LoginRequestDto;
import com.enistere.core.modules.auth.dto.LoginResponseDto;
import com.enistere.core.modules.auth.dto.MeResponseDto;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;
    private final JwtConfig jwtConfig;

    @Value("${enistere.security.stub.username}")
    private String stubUsername;

    @Value("${enistere.security.stub.password}")
    private String stubPassword;

    public AuthController(JwtTokenProvider jwtTokenProvider, JwtConfig jwtConfig) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.jwtConfig = jwtConfig;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody @Valid LoginRequestDto request) {
        // Stub auth — no DB. Replace with UserDetailsService + Argon2id in Spring Boot 3.
        if (!stubUsername.equals(request.email()) || !stubPassword.equals(request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        String token = jwtTokenProvider.generateAccessToken(request.email(), "ADMIN");
        return ResponseEntity.ok(new LoginResponseDto(token, "Bearer", jwtConfig.getExpiration()));
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponseDto> me(Authentication auth) {
        return ResponseEntity.ok(new MeResponseDto(auth.getName()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // Stateless — client discards the token. Token blocklist deferred to Spring Boot 4 (Redis).
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh() {
        // Requires refresh token persistence — deferred to Spring Boot 3 (PostgreSQL).
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
            "Refresh token requires PostgreSQL — coming in Spring Boot 3");
    }
}
