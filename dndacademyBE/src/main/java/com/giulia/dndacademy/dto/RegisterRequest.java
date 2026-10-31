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
    @Pattern(regexp = "[A-Za-z0-9_.-]{3,40}", message = "Username: da 3 a 40 lettere, numeri, punti, trattini o underscore")
    private String username;

    @Email(message = "Email non valida")
    @NotBlank(message = "Email obbligatoria")
    @Size(max = 254)
    private String email;

    @com.giulia.dndacademy.validation.ValidPassword
    private String password;
}
