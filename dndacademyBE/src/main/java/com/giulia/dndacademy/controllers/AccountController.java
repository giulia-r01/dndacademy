package com.giulia.dndacademy.controllers;

import com.giulia.dndacademy.dto.*;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.service.AccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class AccountController {
    private final AccountService accounts;

    @PatchMapping
    public UserDTO update(@AuthenticationPrincipal User user, @Valid @RequestBody UpdateProfileRequest request) {
        return accounts.update(user.getId(), request);
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal User user,
                                               @Valid @RequestBody ChangePasswordRequest request) {
        accounts.changePassword(user.getId(), request);
        return ResponseEntity.noContent().build();
    }

    @PutMapping(value = "/avatar", consumes = "multipart/form-data")
    public UserDTO uploadAvatar(@AuthenticationPrincipal User user, @RequestParam("file") MultipartFile file) {
        return accounts.uploadAvatar(user.getId(), file);
    }

    @DeleteMapping("/avatar")
    public UserDTO removeAvatar(@AuthenticationPrincipal User user) {
        return accounts.removeAvatar(user.getId());
    }
}
