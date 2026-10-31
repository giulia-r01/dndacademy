package com.giulia.dndacademy.dto;

import jakarta.validation.constraints.*;

public record UpdateProfileRequest(
        @NotBlank @Pattern(regexp = "[A-Za-z0-9_.-]{3,40}", message = "Username: da 3 a 40 lettere, numeri, punti, trattini o underscore") String username,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank(message = "Inserisci la password attuale per aggiornare i dati") String currentPassword) {
}
