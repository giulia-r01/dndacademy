package com.giulia.dndacademy.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "npcs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Npc {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private int maxHp;

    @Column(nullable = false)
    private int armorClass;

    @Column(nullable = false)
    private int dexterity;

    @Column(nullable = false)
    private int attackModifier;

    @Column(nullable = false)
    private int damageDie;

    @Column(nullable = false)
    private int damageModifier;

    @Column(nullable = false)
    private boolean enemy;
}