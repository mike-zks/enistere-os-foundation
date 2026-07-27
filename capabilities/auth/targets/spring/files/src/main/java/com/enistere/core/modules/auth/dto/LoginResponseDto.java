package com.enistere.core.modules.auth.dto;

/**
 * Canonical Authentication session response (ADR-068), shared in shape with the
 * other API runtimes: both token lifetimes are explicit and the public identity
 * travels with the session so a client never has to call {@code /me} just to
 * render who is signed in.
 */
public record LoginResponseDto(
    AuthUserDto user,
    String accessToken,
    String refreshToken,
    String tokenType,
    long accessTokenExpiresIn,
    long refreshTokenExpiresIn
) {}
