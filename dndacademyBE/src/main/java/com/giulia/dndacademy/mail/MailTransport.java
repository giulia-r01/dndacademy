package com.giulia.dndacademy.mail;

import jakarta.mail.internet.MimeMessage;

public interface MailTransport {
    void send(MimeMessage message);
}
