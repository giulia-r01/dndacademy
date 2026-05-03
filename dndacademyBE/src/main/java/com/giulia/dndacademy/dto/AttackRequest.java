package com.giulia.dndacademy.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AttackRequest {

    private Long attackerId;
    private Long targetId;
    private int damage;
    private Long combatId;
}
