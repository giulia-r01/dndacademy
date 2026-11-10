package com.giulia.dndacademy.service;

import com.giulia.dndacademy.model.Quiz;
import com.giulia.dndacademy.model.enumerations.Role;
import com.giulia.dndacademy.repository.UserLessonProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class QuizAccessService {
    private final UserLessonProgressRepository progress;
    private final UserService users;

    public void requireReadable(Quiz quiz, String username) {
        // Masters can inspect content while authoring; submitting always requires reading.
        if (users.getByUsername(username).getRole() == Role.MASTER) return;
        requireCompletedLesson(quiz, username);
    }

    public void requireCompletedLesson(Quiz quiz, String username) {
        boolean ready = progress.findByUserUsernameAndLessonId(username, quiz.getLesson().getId())
                .filter(item -> item.isUnlocked() && item.isCompleted()).isPresent();
        if (!ready) throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Leggi la lezione e premi Segna come letta prima di affrontare il quiz.");
    }
}
