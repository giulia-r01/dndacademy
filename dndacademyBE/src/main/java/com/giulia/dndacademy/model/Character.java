package com.giulia.dndacademy.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "characters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Character {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String race;

    private String characterClass;

    @Column(nullable = false)
    private int level;

    private int maxHp;

    private int currentHp;

    private int armorClass;

    @Builder.Default
    @Column(nullable = false)
    private boolean alive = true;

    @ManyToOne
    @JoinColumn(name = "player_id")
    private User player;

    @ManyToOne
    @JoinColumn(name = "campaign_id")
    private Campaign campaign;

    @OneToOne(mappedBy = "character", cascade = CascadeType.ALL)
    private CharacterStats stats;
}