package com.enistere.core.platform.validation;

import jakarta.validation.Validator;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

/** Jakarta Validation implementation hidden behind the neutral port. */
@Component
public class JakartaInputValidationAdapter implements InputValidationPort {

    private final Validator validator;

    public JakartaInputValidationAdapter(Validator validator) {
        this.validator = validator;
    }

    @Override
    public <T> List<ValidationIssue> validate(T value) {
        return validator.validate(value).stream()
            .map(violation -> new ValidationIssue(
                violation.getPropertyPath().toString(),
                violation.getConstraintDescriptor().getAnnotation().annotationType().getSimpleName()))
            .sorted(Comparator.comparing(ValidationIssue::field).thenComparing(ValidationIssue::code))
            .toList();
    }
}
