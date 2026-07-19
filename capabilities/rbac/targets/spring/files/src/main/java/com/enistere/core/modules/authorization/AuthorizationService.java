package com.enistere.core.modules.authorization;

import com.enistere.core.modules.permissions.PermissionRepository;
import com.enistere.core.modules.roles.RoleRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service("rbacAuthorization")
public class AuthorizationService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    public AuthorizationService(RoleRepository roleRepository, PermissionRepository permissionRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }

    @Transactional(readOnly = true)
    public AuthorizationSummaryDto getAuthorization(UUID userId) {
        return new AuthorizationSummaryDto(
            roleRepository.findNamesByUserId(userId),
            permissionRepository.findNamesByUserId(userId)
        );
    }

    @Transactional(readOnly = true)
    public boolean hasRole(Authentication authentication, String role) {
        UUID userId = userIdOrNull(authentication);
        return userId != null && role != null && roleRepository.existsByUserIdAndName(userId, role);
    }

    @Transactional(readOnly = true)
    public boolean hasPermission(Authentication authentication, String permission) {
        UUID userId = userIdOrNull(authentication);
        return userId != null
            && permission != null
            && permissionRepository.existsByUserIdAndName(userId, permission);
    }

    public UUID requireUserId(Authentication authentication) {
        UUID userId = userIdOrNull(authentication);
        if (userId == null) throw new AccessDeniedException("Authenticated user identifier is unavailable");
        return userId;
    }

    private UUID userIdOrNull(Authentication authentication) {
        if (authentication == null || !(authentication.getDetails() instanceof String raw)) return null;
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }
}
