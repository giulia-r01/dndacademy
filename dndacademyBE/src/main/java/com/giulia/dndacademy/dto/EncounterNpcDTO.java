package com.giulia.dndacademy.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EncounterNpcDTO {

    private Long npcId;
    private String npcName;
    private boolean enemy;
    private int quantity;
}