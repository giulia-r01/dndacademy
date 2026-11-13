package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.exceptions.ApiException;

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


@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private com.giulia.dndacademy.repository.UserRepository userRepository;

    @Autowired
    private JwtTool jwtTool;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private com.giulia.dndacademy.security.ratelimit.AuthRateLimiter rateLimiter;

    @PostMapping("/register")
    public ResponseEntity<Void> register(@RequestBody @Valid RegisterRequest request) {
        rateLimiter.checkIdentity("register", request.getEmail());

        if (userService.existsByUsername(request.getUsername())) {
            throw ApiException.conflict("Username già in uso");
        }

        if (userService.existsByEmail(request.getEmail())) {
            throw ApiException.conflict("Email già registrata");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail().trim().toLowerCase(java.util.Locale.ROOT))
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.PLAYER)
                .learningLevel(LearningLevel.BEGINNER)
                .build();

        userService.register(user);

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid AuthRequest request) {
        rateLimiter.checkIdentity("login", request.getUsername());

        User user = userRepository.findByUsername(request.getUsername()).orElse(null);
        if (user == null) throw ApiException.unauthorized("Credenziali non valide");

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw ApiException.unauthorized("Credenziali non valide");
        }

        String token = jwtTool.generateToken(user);

        return ResponseEntity.ok(new AuthResponse(token));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(
            @RequestBody @Valid ForgotPasswordRequest request
    ) {
        rateLimiter.checkIdentity("forgot-password", request.getEmail());
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
