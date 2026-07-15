package com.enistere.core.common.exception;

import java.time.Instant;
import java.util.List;

public record ApiError(
    int status,
    String code,
    String message,
    List<String> errors,
    Instant timestamp,
    String path
) {}
