package com.giulia.dndacademy.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.constraints.NotEmpty;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthRequest {
    @NotEmpty(message = "Username è obbligatorio")
    private String username;

    @NotEmpty(message = "Password è obbligatoria")
    private String password;
}