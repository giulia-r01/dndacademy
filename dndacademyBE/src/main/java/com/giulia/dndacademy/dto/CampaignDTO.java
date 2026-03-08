package com.giulia.dndacademy.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignDTO {

    private Long id;
    private String name;
    private String description;
    private String masterUsername;
}