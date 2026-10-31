package com.giulia.dndacademy.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordValidator.class)
public @interface ValidPassword {
    String message() default "La password deve avere almeno 8 caratteri, una maiuscola, un numero o simbolo e non superare 72 byte";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
