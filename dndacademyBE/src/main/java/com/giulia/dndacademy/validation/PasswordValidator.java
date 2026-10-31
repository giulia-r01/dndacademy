package com.giulia.dndacademy.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.nio.charset.StandardCharsets;

public class PasswordValidator implements ConstraintValidator<ValidPassword, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value != null && value.length() >= 8
                && value.getBytes(StandardCharsets.UTF_8).length <= 72
                && value.matches("(?s).*[A-Z].*")
                && value.matches("(?s).*[0-9!@#$%^&*(),.?\":{}|<>].*");
    }
}
