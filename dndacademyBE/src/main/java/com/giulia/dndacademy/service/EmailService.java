package com.giulia.dndacademy.service;

public interface EmailService {

    void sendPasswordResetEmail(String to, String username, String resetLink);
}