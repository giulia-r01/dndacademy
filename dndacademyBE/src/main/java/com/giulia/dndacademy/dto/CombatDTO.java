package com.giulia.dndacademy.dto;
import com.giulia.dndacademy.model.enumerations.CombatOutcome;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CombatDTO {
    private Long id;
    private Long campaignId;
    private Long chapterId;
    private Long encounterId;
    private List<Long> turnOrder;
    private int currentTurnIndex;
    private boolean completed;
    private CombatOutcome outcome;
    private LocalDateTime completedAt;
}
