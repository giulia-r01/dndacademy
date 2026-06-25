package com.giulia.dndacademy.dto;

import com.giulia.dndacademy.model.enumerations.CampaignDifficulty;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignDTO {

    private Long id;
    private String name;
    private String description;
    private String masterUsername;
    private CampaignDifficulty difficulty;
    private long chaptersCount;
}