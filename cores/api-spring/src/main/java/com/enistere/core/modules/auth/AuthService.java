package com.enistere.core.modules.auth;

import com.enistere.core.config.JwtConfig;
import com.enistere.core.infrastructure.security.JwtTokenProvider;
import com.enistere.core.modules.audit.AuditEventType;
import com.enistere.core.modules.audit.AuditService;
import com.enistere.core.modules.auth.dto.LoginResponseDto;
import com.enistere.core.modules.auth.dto.MeResponseDto;
import com.enistere.core.modules.permissions.PermissionRepository;
import com.enistere.core.modules.roles.Role;
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
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AuthService {

    private static final Duration REFRESH_EXPIRY = Duration.ofDays(30);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtConfig jwtConfig;
    private final AuditService auditService;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PermissionRepository permissionRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            JwtConfig jwtConfig,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.permissionRepository = permissionRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.jwtConfig = jwtConfig;
        this.auditService = auditService;
    }

    public LoginResponseDto login(String email, String rawPassword, String ipAddress, String userAgent) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null || !passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            auditService.record(AuditEventType.LOGIN_FAILURE, null, "auth", null, ipAddress, userAgent);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        if (!user.isActive()) {
            auditService.record(AuditEventType.LOGIN_FAILURE, null, "auth", null, ipAddress, userAgent);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account disabled");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        LoginResponseDto response = buildTokenResponse(user);
        auditService.record(AuditEventType.LOGIN_SUCCESS, user.getId(), "auth", null, ipAddress, userAgent);
        return response;
    }

    @Transactional(readOnly = true)
    public MeResponseDto me(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        List<String> roleNames = user.getRoles().stream().map(Role::getName).toList();
        List<String> permNames = permissionRepository.findPermissionNamesByUserId(user.getId());

        return new MeResponseDto(user.getId().toString(), user.getEmail(), roleNames, permNames);
    }

    public LoginResponseDto refresh(String rawRefreshToken, String ipAddress, String userAgent) {
        String hash = hashToken(rawRefreshToken);
        RefreshToken token = refreshTokenRepository.findByTokenHash(hash)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (token.isRevoked() || token.isExpired()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expired or revoked");
        }

        UUID userId = token.getUser().getId();
        token.revoke();
        refreshTokenRepository.save(token);

        LoginResponseDto response = buildTokenResponse(token.getUser());
        auditService.record(AuditEventType.TOKEN_REFRESH, userId, "auth", null, ipAddress, userAgent);
        return response;
    }

    public void logout(String rawRefreshToken, UUID callerUserId, String ipAddress, String userAgent) {
        auditService.record(AuditEventType.LOGOUT, callerUserId, "auth", null, ipAddress, userAgent);
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        String hash = hashToken(rawRefreshToken);
        refreshTokenRepository.findByTokenHash(hash).ifPresent(token -> {
            token.revoke();
            refreshTokenRepository.save(token);
        });
    }

    private LoginResponseDto buildTokenResponse(User user) {
        List<String> permissions = permissionRepository.findPermissionNamesByUserId(user.getId());
        String accessToken = jwtTokenProvider.generateAccessToken(
            user.getEmail(), user.getId().toString(), permissions
        );
        String rawRefresh = generateRawToken();
        refreshTokenRepository.save(
            new RefreshToken(user, hashToken(rawRefresh), Instant.now().plus(REFRESH_EXPIRY))
        );
        return new LoginResponseDto(accessToken, rawRefresh, "Bearer", jwtConfig.getExpiration());
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
