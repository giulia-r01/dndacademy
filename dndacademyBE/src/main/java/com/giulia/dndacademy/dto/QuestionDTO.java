package com.giulia.dndacademy.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionDTO {

    private Long id;
    private String text;
    private List<AnswerDTO> answers;
}