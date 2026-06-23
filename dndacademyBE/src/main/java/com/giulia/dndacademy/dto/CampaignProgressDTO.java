package com.giulia.dndacademy.dto;

import com.giulia.dndacademy.model.enumerations.CampaignDifficulty;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignProgressDTO {

    private Long campaignId;

    private String campaignName;

    private String campaignDescription;

    private CampaignDifficulty difficulty;

    private boolean unlocked;

    private boolean completed;

    private LocalDateTime completedAt;
}