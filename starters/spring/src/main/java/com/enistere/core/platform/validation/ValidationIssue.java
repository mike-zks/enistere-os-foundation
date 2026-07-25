package com.enistere.core.platform.validation;

/** Framework-neutral, bounded validation finding. */
public record ValidationIssue(String field, String code) {
}
