package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.UserDTO;
import com.giulia.dndacademy.model.User;

import java.util.List;

public interface UserService {
    User register(User user);
    UserDTO getUserById(Long id);
    List<UserDTO> getAllUsers();
    User getByUsername(String username);
    UserDTO getByUsernameDTO(String username);
    void updateLearningLevel(String username);
}