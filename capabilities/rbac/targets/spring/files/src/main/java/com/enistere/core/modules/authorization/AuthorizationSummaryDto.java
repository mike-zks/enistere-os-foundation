package com.enistere.core.modules.authorization;

import java.util.List;

public record AuthorizationSummaryDto(List<String> roles, List<String> permissions) {
    public AuthorizationSummaryDto {
        roles = List.copyOf(roles);
        permissions = List.copyOf(permissions);
    }
}
