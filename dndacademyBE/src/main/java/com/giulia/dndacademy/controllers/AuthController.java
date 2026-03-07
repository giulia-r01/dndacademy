package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.AuthRequest;
import com.giulia.dndacademy.dto.AuthResponse;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.service.UserService;
import com.giulia.dndacademy.security.JwtTool;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTool jwtTool;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody @Valid User user) {
        // Hash della password prima di salvare
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User savedUser = userService.register(user);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid AuthRequest request) {
        User user = userService.getByUsername(request.getUsername());

        if (user == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        String token = jwtTool.generateToken(user.getUsername());
        return ResponseEntity.ok(new AuthResponse(token));
    }
}