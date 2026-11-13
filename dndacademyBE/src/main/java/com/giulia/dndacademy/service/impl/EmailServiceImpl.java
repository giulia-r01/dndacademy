package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.mail.MailTokens;
import com.giulia.dndacademy.model.*;
import com.giulia.dndacademy.repository.EmailOutboxRepository;
import com.giulia.dndacademy.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import java.time.*;

@Service @RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {
    private final EmailOutboxRepository outbox;
    private final org.springframework.context.ApplicationEventPublisher events;

    @Override @Transactional(propagation = Propagation.MANDATORY)
    public void queueWelcomeEmail(User user) {
        enqueue(user, EmailOutbox.Kind.WELCOME, null, Instant.now().plus(Duration.ofDays(1)));
    }

    @Override @Transactional(propagation = Propagation.MANDATORY)
    public void queuePasswordResetEmail(User user, PasswordResetToken token) {
        enqueue(user, EmailOutbox.Kind.PASSWORD_RESET, MailTokens.hash(token.getToken()), token.getExpirationDate().toInstant(ZoneOffset.UTC));
    }

    private void enqueue(User user, EmailOutbox.Kind kind, String resetHash, Instant expiry) {
        var task = new EmailOutbox();
        task.setUserId(user.getId());
        task.setRecipient(user.getEmail());
        task.setKind(kind);
        task.setStatus(EmailOutbox.Status.PENDING);
        task.setResetTokenHash(resetHash);
        task.setCreatedAt(Instant.now());
        task.setExpiresAt(expiry);
        task.setNextAttemptAt(task.getCreatedAt());
        task.setUpdatedAt(task.getCreatedAt());
        outbox.save(task);
        events.publishEvent(new com.giulia.dndacademy.background.QueueChanged(com.giulia.dndacademy.background.QueueWakeups.Kind.EMAIL));
    }
}
