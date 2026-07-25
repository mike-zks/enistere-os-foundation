package com.enistere.core.platform.validation;

import java.util.List;

/** Neutral input-validation seam used by API adapters and capabilities. */
public interface InputValidationPort {
    <T> List<ValidationIssue> validate(T value);
}
