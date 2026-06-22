package com.giulia.dndacademy.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

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

    @ManyToOne
    private Campaign campaign;

    @ManyToOne
    @JoinColumn(name = "chapter_id")
    private CampaignChapter chapter;

    @ElementCollection
    private List<Long> turnOrder;

    @ElementCollection
    private List<Integer> initiativeRolls;

    private int currentTurnIndex;

    private boolean completed;

    private Long winnerCharacterId;

    private LocalDateTime completedAt;
}