package com.giulia.dndacademy.service;

import com.giulia.dndacademy.dto.ForgotPasswordRequest;
import com.giulia.dndacademy.dto.ResetPasswordRequest;

public interface PasswordResetService {

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);
}