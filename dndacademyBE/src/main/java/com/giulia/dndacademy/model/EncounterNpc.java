package com.giulia.dndacademy.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.*;

@Entity
@Table(name = "encounter_npcs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EncounterNpc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "encounter_id", nullable = false)
    private Encounter encounter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "npc_id", nullable = false)
    private Npc npc;

    @Min(1)
    @Column(nullable = false)
    private int quantity;
}