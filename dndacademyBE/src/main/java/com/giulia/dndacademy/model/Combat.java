package com.giulia.dndacademy.model;

import jakarta.persistence.*;
import lombok.*;

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

    @ElementCollection
    private List<Long> turnOrder;

    @ElementCollection
    private List<Integer> initiativeRolls;

    private int currentTurnIndex;

}
