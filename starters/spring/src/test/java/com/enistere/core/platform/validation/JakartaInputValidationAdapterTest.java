package com.enistere.core.platform.validation;

import jakarta.validation.Validation;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JakartaInputValidationAdapterTest {

    record Command(@NotBlank String name) {
    }

    @Test
    void emitsDeterministicFrameworkNeutralIssues() {
        var adapter = new JakartaInputValidationAdapter(
            Validation.buildDefaultValidatorFactory().getValidator());

        assertThat(adapter.validate(new Command("")))
            .containsExactly(new ValidationIssue("name", "NotBlank"));
        assertThat(adapter.validate(new Command("valid"))).isEmpty();
    }
}
