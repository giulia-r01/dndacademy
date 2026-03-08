package com.giulia.dndacademy.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateCampaignRequest {

    @NotEmpty
    private String name;

    private String description;
}