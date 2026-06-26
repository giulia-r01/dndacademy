package com.giulia.dndacademy.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAnswerDTO {

    private Long id;
    private String text;
    private boolean correct;
}