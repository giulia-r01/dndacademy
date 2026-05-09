package com.giulia.dndacademy.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SubmitAnswerRequest {

    private Long questionId;
    private Long answerId;
}