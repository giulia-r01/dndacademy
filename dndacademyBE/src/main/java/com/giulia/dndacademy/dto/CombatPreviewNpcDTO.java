package com.giulia.dndacademy.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CombatPreviewNpcDTO {
    private NpcDTO npc;
    private int quantity;
}
