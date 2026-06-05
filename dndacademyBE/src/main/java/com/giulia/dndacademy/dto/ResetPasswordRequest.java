package com.giulia.dndacademy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {

    @NotBlank(message = "Token obbligatorio")
    private String token;

    @NotBlank(message = "Nuova password obbligatoria")
    @Size(min = 6, message = "La password deve avere almeno 6 caratteri")
    private String newPassword;
}