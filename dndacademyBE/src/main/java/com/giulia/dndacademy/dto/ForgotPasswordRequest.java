package com.giulia.dndacademy.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ForgotPasswordRequest {

    @Email(message = "Email non valida")
    @NotBlank(message = "Email obbligatoria")
    private String email;
}