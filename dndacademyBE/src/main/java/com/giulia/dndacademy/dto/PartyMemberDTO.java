package com.giulia.dndacademy.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartyMemberDTO {

    private String playerUsername;

    private String characterName;

    private String characterClass;

    private int level;
}
