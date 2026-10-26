package com.giulia.dndacademy.model;

import com.giulia.dndacademy.model.enumerations.CombatOutcome;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Combat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private Campaign campaign;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id", nullable = false)
    private CampaignChapter chapter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "encounter_id", nullable = false)
    private Encounter encounter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ElementCollection
    private List<Long> turnOrder;
    private int currentTurnIndex;
    @ElementCollection
    @CollectionTable(name = "combat_events", joinColumns = @JoinColumn(name = "combat_id"))
    @OrderColumn(name = "event_index")
    @Builder.Default
    private List<CombatEvent> events = new ArrayList<>();
    private boolean completed;

    @Enumerated(EnumType.STRING)
    private CombatOutcome outcome;
    private LocalDateTime completedAt;
}
