package com.enistere.core.modules.authorization;

import com.enistere.core.modules.permissions.PermissionRepository;
import com.enistere.core.modules.roles.RoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthorizationServiceTest {

    @Mock private RoleRepository roleRepository;
    @Mock private PermissionRepository permissionRepository;
    @Mock private Authentication authentication;

    private AuthorizationService service;
    private UUID userId;

    @BeforeEach
    void setUp() {
        service = new AuthorizationService(roleRepository, permissionRepository);
        userId = UUID.randomUUID();
    }

    @Test
    void getAuthorization_returnsDefensiveSummary() {
        when(roleRepository.findNamesByUserId(userId)).thenReturn(List.of("administrator"));
        when(permissionRepository.findNamesByUserId(userId)).thenReturn(List.of("files.read"));

        AuthorizationSummaryDto result = service.getAuthorization(userId);

        assertThat(result.roles()).containsExactly("administrator");
        assertThat(result.permissions()).containsExactly("files.read");
    }

    @Test
    void predicatesUseServerSideUserIdentifier() {
        when(authentication.getDetails()).thenReturn(userId.toString());
        when(roleRepository.existsByUserIdAndName(userId, "administrator")).thenReturn(true);
        when(permissionRepository.existsByUserIdAndName(userId, "files.read")).thenReturn(true);

        assertThat(service.hasRole(authentication, "administrator")).isTrue();
        assertThat(service.hasPermission(authentication, "files.read")).isTrue();
        assertThat(service.hasPermission(authentication, "files.delete")).isFalse();
    }

    @Test
    void malformedOrMissingAuthenticationNeverGrantsAccess() {
        when(authentication.getDetails()).thenReturn("not-a-uuid");

        assertThat(service.hasRole(null, "administrator")).isFalse();
        assertThat(service.hasPermission(authentication, "files.read")).isFalse();
    }
}
