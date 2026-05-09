package com.giulia.dndacademy.dto;

import com.giulia.dndacademy.model.enumerations.LearningLevel;
import com.giulia.dndacademy.model.enumerations.Role;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private Role role;
    private LearningLevel learningLevel;
}