package com.giulia.dndacademy.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CombatPreviewDTO {
    private Long chapterId;
    private Long campaignId;
    private String campaignName;
    private String chapterTitle;
    private String title;
    private String description;
    private List<CombatPreviewNpcDTO> participants;
}
