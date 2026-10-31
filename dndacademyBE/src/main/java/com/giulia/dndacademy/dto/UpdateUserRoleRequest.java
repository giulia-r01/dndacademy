package com.giulia.dndacademy.dto;

import com.giulia.dndacademy.model.enumerations.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(@NotNull(message = "Il ruolo e obbligatorio") Role role) {
}