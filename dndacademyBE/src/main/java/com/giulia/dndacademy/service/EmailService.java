package com.giulia.dndacademy.service;

import com.giulia.dndacademy.model.PasswordResetToken;
import com.giulia.dndacademy.model.User;

public interface EmailService {

    void queuePasswordResetEmail(User user, PasswordResetToken token);

    void queueWelcomeEmail(User user);
}
