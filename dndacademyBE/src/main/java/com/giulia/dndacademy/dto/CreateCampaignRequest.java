package com.giulia.dndacademy.dto;

import com.giulia.dndacademy.model.enumerations.CampaignDifficulty;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateCampaignRequest {

    @NotEmpty
    private String name;

    private String description;

    @NotNull
    private CampaignDifficulty difficulty;
}