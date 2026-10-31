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
    public static UserDTO from(com.giulia.dndacademy.model.User user) {
        return UserDTO.builder().id(user.getId()).username(user.getUsername())
                .email(user.getEmail()).role(user.getRole()).learningLevel(user.getLearningLevel())
                .avatarUrl(user.getAvatarUrl()).build();
    }

    private String avatarUrl;
    private Long id;
    private String username;
    private String email;
    private Role role;
    private LearningLevel learningLevel;
}