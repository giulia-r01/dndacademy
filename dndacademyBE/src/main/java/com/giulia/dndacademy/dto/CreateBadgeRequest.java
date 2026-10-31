package com.giulia.dndacademy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateBadgeRequest {
    @NotBlank(message = "Il nome del badge e obbligatorio")
    @Size(max = 255)
    private String name;
    @NotBlank(message = "La descrizione del badge e obbligatoria")
    @Size(max = 1000)
    private String description;
}
