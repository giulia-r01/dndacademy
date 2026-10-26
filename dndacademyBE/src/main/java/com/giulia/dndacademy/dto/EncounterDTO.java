package com.giulia.dndacademy.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EncounterDTO {

    private Long id;
    private String title;
    private String description;
    private Long chapterId;
    private Long campaignId;
    private List<EncounterNpcDTO> npcs;
}