package com.giulia.dndacademy.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotEmpty(message = "Username obbligatorio")
    private String username;

    @Email(message = "Email non valida")
    @NotEmpty(message = "Email obbligatoria")
    private String email;

    @NotEmpty(message = "Password obbligatoria")
    private String password;
}