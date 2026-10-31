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
    @com.giulia.dndacademy.validation.ValidPassword
    private String newPassword;
}