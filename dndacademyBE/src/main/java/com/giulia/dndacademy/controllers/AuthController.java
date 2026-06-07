package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.AuthRequest;
import com.giulia.dndacademy.dto.AuthResponse;
import com.giulia.dndacademy.dto.RegisterRequest;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.service.UserService;
import com.giulia.dndacademy.security.JwtTool;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.giulia.dndacademy.model.enumerations.Role;
import com.giulia.dndacademy.model.enumerations.LearningLevel;
import com.giulia.dndacademy.dto.ForgotPasswordRequest;
import com.giulia.dndacademy.dto.ResetPasswordRequest;
import com.giulia.dndacademy.service.PasswordResetService;
import com.giulia.dndacademy.service.EmailService;


@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTool jwtTool;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private EmailService emailService;

    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody @Valid RegisterRequest request) {

        if (userService.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username già in uso");
        }

        if (userService.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email già registrata");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.PLAYER)
                .learningLevel(LearningLevel.BEGINNER)
                .build();

        User savedUser = userService.register(user);

        try {
            emailService.sendWelcomeEmail(
                    savedUser.getEmail(),
                    savedUser.getUsername()
            );
        } catch (RuntimeException e) {
            System.out.println("Errore invio email di benvenuto: " + e.getMessage());
        }

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid AuthRequest request) {

        User user = userService.getByUsername(request.getUsername());

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        String token = jwtTool.generateToken(user.getUsername());

        return ResponseEntity.ok(new AuthResponse(token));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(
            @RequestBody @Valid ForgotPasswordRequest request
    ) {
        passwordResetService.forgotPassword(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(
            @RequestBody @Valid ResetPasswordRequest request
    ) {
        passwordResetService.resetPassword(request);
        return ResponseEntity.ok().build();
    }
}