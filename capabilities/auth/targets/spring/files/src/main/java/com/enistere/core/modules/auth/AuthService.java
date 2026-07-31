package com.enistere.core.modules.auth;

import com.enistere.core.common.exception.CodedException;
import com.enistere.core.modules.auth.JwtConfig;
import com.enistere.core.modules.auth.security.JwtTokenProvider;
import com.enistere.core.modules.audit.AuditService;
import com.enistere.core.modules.auth.dto.AuthUserDto;
import com.enistere.core.modules.auth.dto.LoginResponseDto;
import com.enistere.core.modules.auth.dto.MeResponseDto;
import com.enistere.core.modules.users.User;
import com.enistere.core.modules.users.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;

@Service
@Transactional
public class AuthService {

    private static final Duration REFRESH_EXPIRY = Duration.ofDays(30);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtConfig jwtConfig;
    private final AuditService auditService;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            JwtConfig jwtConfig,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.jwtConfig = jwtConfig;
        this.auditService = auditService;
    }

    public LoginResponseDto login(String email, String rawPassword) {
        User user = userRepository.findByEmail(email).orElse(null);

        // Unknown identity, wrong password and disabled account are indistinguishable
        // to the caller: same code, same message. Only the audit trail separates them.
        if (user == null || !passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            auditService.record(AuthAuditEvents.LOGIN_FAILED, null, "auth", null, null, null);
            throw invalidCredentials();
        }
        if (!user.isActive()) {
            auditService.record(AuthAuditEvents.LOGIN_FAILED, user.getId(), "auth", null, null, null);
            throw invalidCredentials();
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        LoginResponseDto response = buildTokenResponse(user);
        auditService.record(AuthAuditEvents.LOGIN_SUCCEEDED, user.getId(), "auth", null, null, null);
        return response;
    }

    @Transactional(readOnly = true)
    public MeResponseDto me(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return new MeResponseDto(user.getId().toString(), user.getEmail());
    }

    public LoginResponseDto refresh(String rawRefreshToken) {
        String hash = hashToken(rawRefreshToken);
        RefreshToken token = refreshTokenRepository.findByTokenHash(hash).orElse(null);

        if (token == null) {
            auditService.record(AuthAuditEvents.REFRESH_FAILED, null, "auth", null, null, null);
            throw invalidRefreshToken();
        }
        // A revoked token is also the reuse signal: rotation revokes on every use.
        if (token.isRevoked() || token.isExpired()) {
            auditService.record(AuthAuditEvents.REFRESH_FAILED, token.getUser().getId(), "auth", null, null, null);
            throw invalidRefreshToken();
        }

        token.revoke();
        refreshTokenRepository.save(token);

        LoginResponseDto response = buildTokenResponse(token.getUser());
        auditService.record(AuthAuditEvents.REFRESH_SUCCEEDED, token.getUser().getId(), "auth", null, null, null);
        return response;
    }

    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        String hash = hashToken(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(hash).ifPresent(token -> {
            token.revoke();
            refreshTokenRepository.save(token);
            auditService.record(AuthAuditEvents.LOGOUT, token.getUser().getId(), "auth", null, null, null);
        });
    }

    private LoginResponseDto buildTokenResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(
            user.getEmail(), user.getId().toString()
        );
        String rawRefresh = generateRawToken();
        // Only the one-way fingerprint is persisted; the raw token exists solely in
        // this response and is unrecoverable from the store.
        refreshTokenRepository.save(
            new RefreshToken(user, hashToken(rawRefresh), Instant.now().plus(REFRESH_EXPIRY))
        );
        return new LoginResponseDto(
            toPublicUser(user),
            accessToken,
            rawRefresh,
            "Bearer",
            jwtConfig.getExpiration(),
            REFRESH_EXPIRY.toSeconds()
        );
    }

    private static AuthUserDto toPublicUser(User user) {
        return new AuthUserDto(
            user.getId().toString(),
            user.getEmail(),
            user.isActive() ? "ACTIVE" : "DISABLED"
        );
    }

    private static CodedException invalidCredentials() {
        return new CodedException(
            HttpStatus.UNAUTHORIZED, AuthErrorCodes.AUTH_INVALID_CREDENTIALS, "Invalid credentials");
    }

    private static CodedException invalidRefreshToken() {
        return new CodedException(
            HttpStatus.UNAUTHORIZED, AuthErrorCodes.AUTH_REFRESH_TOKEN_INVALID, "Invalid refresh token");
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
