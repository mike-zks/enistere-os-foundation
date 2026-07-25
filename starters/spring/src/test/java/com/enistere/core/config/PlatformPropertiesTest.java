package com.enistere.core.config;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PlatformPropertiesTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void acceptsBoundedRuntimeConfiguration() {
        assertThat(validator.validate(new PlatformProperties("api-spring-core", 20))).isEmpty();
    }

    @Test
    void rejectsBlankServiceAndUnboundedShutdownTimeout() {
        var violations = validator.validate(new PlatformProperties(" ", 0));
        assertThat(violations)
            .extracting(violation -> violation.getPropertyPath().toString())
            .containsExactlyInAnyOrder("serviceName", "shutdownTimeoutSeconds");
    }
}
