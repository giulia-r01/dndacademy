package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.exceptions.ApiException;

import com.giulia.dndacademy.dto.ForgotPasswordRequest;
import com.giulia.dndacademy.dto.ResetPasswordRequest;
import com.giulia.dndacademy.model.PasswordResetToken;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.repository.PasswordResetTokenRepository;
import com.giulia.dndacademy.repository.UserRepository;
import com.giulia.dndacademy.service.EmailService;
import com.giulia.dndacademy.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
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
        resetToken.setExpirationDate(LocalDateTime.now(java.time.Clock.systemUTC()).plusMinutes(30));
        resetToken.setUsed(false);

        tokenRepository.save(resetToken);

        emailService.queuePasswordResetEmail(user, resetToken);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {

        PasswordResetToken resetToken = tokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> ApiException.badRequest("Token non valido"));

        if (resetToken.isUsed()) {
            throw ApiException.badRequest("Token già utilizzato");
        }

        if (!resetToken.getExpirationDate().isAfter(LocalDateTime.now(java.time.Clock.systemUTC()))) {
            throw ApiException.badRequest("Token scaduto");
        }

        User user = userRepository.findForUpdateById(resetToken.getUser().getId()).orElseThrow();
        entityManager.refresh(resetToken);
        if (resetToken.isUsed() || !resetToken.getExpirationDate().isAfter(LocalDateTime.now(java.time.Clock.systemUTC()))) {
            throw ApiException.badRequest("Token non valido o scaduto");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw ApiException.badRequest("La nuova password deve essere diversa da quella precedente");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setTokenVersion(user.getTokenVersion() + 1);

        userRepository.save(user);

        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
    }
}
