package com.giulia.dndacademy.dto;

import jakarta.validation.constraints.NotBlank;
import com.giulia.dndacademy.validation.ValidPassword;

public record ChangePasswordRequest(
        @NotBlank(message = "Password attuale obbligatoria") String currentPassword,
        @ValidPassword String newPassword) {
}
