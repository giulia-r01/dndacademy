package com.giulia.dndacademy.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record DeleteAccountRequest(
        @NotBlank(message = "Password attuale obbligatoria") String currentPassword,
        @AssertTrue(message = "Conferma la cancellazione definitiva dell account") boolean confirmed,
        @Positive Long successorMasterId) {
}
