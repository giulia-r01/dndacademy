package com.giulia.dndacademy.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BadgeDTO {

    private Long id;
    private String name;
    private String description;
    private LocalDateTime unlockedAt;
}