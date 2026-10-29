package com.giulia.dndacademy.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CombatHistoryDTO {
    private List<CombatHistoryEntryDTO> items;
    private int page;
    private int size;
    private int totalPages;
    private long totalElements;
}
