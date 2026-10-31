package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.*;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AccountService {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final PasswordResetTokenRepository resetTokens;
    private final ImageUploadService images;

    private User lock(Long id) {
        return users.findForUpdateById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utente non trovato"));
    }

    private void checkPassword(User user, String password) {
        if (!passwords.matches(password, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password attuale non corretta");
        }
    }

    @Transactional
    public UserDTO update(Long id, UpdateProfileRequest request) {
        User user = lock(id);
        checkPassword(user, request.currentPassword());
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByUsernameAndIdNot(request.username(), id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username gia in uso");
        }
        if (users.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email gia registrata");
        }
        if (!email.equals(user.getEmail())) resetTokens.deleteByUserId(id);
        user.setUsername(request.username());
        user.setEmail(email);
        return UserDTO.from(users.saveAndFlush(user));
    }

    @Transactional
    public void changePassword(Long id, ChangePasswordRequest request) {
        User user = lock(id);
        checkPassword(user, request.currentPassword());
        if (passwords.matches(request.newPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La nuova password deve essere diversa da quella attuale");
        }
        user.setPassword(passwords.encode(request.newPassword()));
        user.setTokenVersion(user.getTokenVersion() + 1);
        resetTokens.deleteByUserId(id);
        users.save(user);
    }

    @Transactional
    public UserDTO uploadAvatar(Long id, MultipartFile file) {
        User user = lock(id);
        user.setAvatarUrl(images.uploadUserImage(file, id));
        return UserDTO.from(users.save(user));
    }

    @Transactional
    public UserDTO removeAvatar(Long id) {
        User user = lock(id);
        if (user.getAvatarUrl() != null) images.deleteUserImage(id);
        user.setAvatarUrl(null);
        return UserDTO.from(users.save(user));
    }
}
