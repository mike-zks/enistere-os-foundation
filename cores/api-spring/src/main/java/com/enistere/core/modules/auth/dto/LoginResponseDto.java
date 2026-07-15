package com.enistere.core.modules.auth.dto;

public record LoginResponseDto(
    String accessToken,
    String tokenType,
    long expiresIn
) {}
