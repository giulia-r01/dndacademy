package com.giulia.dndacademy.dto;

import com.giulia.dndacademy.model.enumerations.CampaignDifficulty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateCampaignRequest {

    @NotBlank(message = "Il nome della campagna e obbligatorio")
    @Size(max = 255)
    private String name;

    @Size(max = 2000)
    private String description;

    @NotNull
    private CampaignDifficulty difficulty;
}