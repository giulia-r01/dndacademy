package com.giulia.dndacademy.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Username obbligatorio")
    private String username;

    @Email(message = "Email non valida")
    @NotBlank(message = "Email obbligatoria")
    private String email;

    @NotBlank(message = "Password obbligatoria")
    @Size(min = 8, message = "La password deve avere almeno 8 caratteri")
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*[0-9!@#$%^&*(),.?\":{}|<>]).*$",
            message = "La password deve contenere almeno una lettera maiuscola e almeno un numero o carattere speciale"
    )
    private String password;
}