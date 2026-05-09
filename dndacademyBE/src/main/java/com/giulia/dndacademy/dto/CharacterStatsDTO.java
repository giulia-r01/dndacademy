package com.giulia.dndacademy.dto;

import lombok.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CharacterStatsDTO {

    @Min(1)
    @Max(30)
    private int strength;

    @Min(1)
    @Max(30)
    private int dexterity;

    @Min(1)
    @Max(30)
    private int constitution;

    @Min(1)
    @Max(30)
    private int intelligence;

    @Min(1)
    @Max(30)
    private int wisdom;

    @Min(1)
    @Max(30)
    private int charisma;
}