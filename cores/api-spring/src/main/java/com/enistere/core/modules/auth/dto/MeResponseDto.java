package com.enistere.core.modules.auth.dto;

import java.util.List;

public record MeResponseDto(
    String userId,
    String email,
    List<String> roles,
    List<String> permissions
) {}
