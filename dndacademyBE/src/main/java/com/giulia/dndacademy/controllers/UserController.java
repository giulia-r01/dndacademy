package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.UserDTO;
import org.springframework.security.core.Authentication;
import com.giulia.dndacademy.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;


    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
        UserDTO dto = userService.getUserById(id);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getMe(Authentication authentication) {
        String username = authentication.getName();

        UserDTO dto = userService.getByUsernameDTO(username);

        return ResponseEntity.ok(dto);
    }
}