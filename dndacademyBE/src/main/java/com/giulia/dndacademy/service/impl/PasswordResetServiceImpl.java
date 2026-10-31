package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.ForgotPasswordRequest;
import com.giulia.dndacademy.dto.ResetPasswordRequest;
import com.giulia.dndacademy.model.PasswordResetToken;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.repository.PasswordResetTokenRepository;
import com.giulia.dndacademy.repository.UserRepository;
import com.giulia.dndacademy.service.EmailService;
import com.giulia.dndacademy.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final jakarta.persistence.EntityManager entityManager;

    @Value("${app.frontend-base-url}")
    private String frontendBaseUrl;

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {

        User candidate = userRepository.findByEmailIgnoreCase(request.getEmail().trim()).orElse(null);
        if (candidate == null) return;
        User user = userRepository.findForUpdateById(candidate.getId()).orElseThrow();
        entityManager.refresh(user);
        if (!user.getEmail().equalsIgnoreCase(request.getEmail().trim())) return;

        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = tokenRepository.findByUserId(user.getId())
                .orElse(PasswordResetToken.builder()
                        .user(user)
                        .build());

        resetToken.setToken(token);
        resetToken.setExpirationDate(LocalDateTime.now().plusMinutes(30));
        resetToken.setUsed(false);

        tokenRepository.save(resetToken);

        String resetLink = frontendBaseUrl + "/reset-password?token=" + token;

        emailService.sendPasswordResetEmail(
                user.getEmail(),
                user.getUsername(),
                resetLink
        );
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {

        PasswordResetToken resetToken = tokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Token non valido"));

        if (resetToken.isUsed()) {
            throw new RuntimeException("Token già utilizzato");
        }

        if (resetToken.getExpirationDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token scaduto");
        }

        User user = userRepository.findForUpdateById(resetToken.getUser().getId()).orElseThrow();
        // Re-read after taking the user lock: a password/email change may have invalidated the token.
        entityManager.refresh(resetToken);
        if (resetToken.isUsed() || resetToken.getExpirationDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token non valido o scaduto");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new RuntimeException("La nuova password deve essere diversa da quella precedente");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setTokenVersion(user.getTokenVersion() + 1);

        userRepository.save(user);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
    }
}