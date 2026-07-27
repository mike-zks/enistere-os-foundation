package com.enistere.core.modules.auth.dto;

/**
 * Public identity returned with a session (ADR-068). Contains no password, no
 * hash and no token material.
 */
public record AuthUserDto(
    String id,
    String email,
    String status
) {}
