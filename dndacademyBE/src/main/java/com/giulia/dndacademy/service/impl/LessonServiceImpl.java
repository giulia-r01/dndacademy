package com.giulia.dndacademy.service.impl;

import com.giulia.dndacademy.dto.*;
import com.giulia.dndacademy.model.Lesson;
import com.giulia.dndacademy.repository.CampaignChapterRepository;
import com.giulia.dndacademy.repository.LessonRepository;
import com.giulia.dndacademy.repository.QuizRepository;
import com.giulia.dndacademy.repository.UserLessonProgressRepository;
import com.giulia.dndacademy.service.LessonService;
import com.giulia.dndacademy.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.giulia.dndacademy.model.User;
import com.giulia.dndacademy.model.UserLessonProgress;

import java.time.LocalDateTime;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LessonServiceImpl implements LessonService {

    private final LessonRepository lessonRepository;
    private final UserLessonProgressRepository userLessonProgressRepository;
    private final UserService userService;
    private final QuizRepository quizRepository;
    private final CampaignChapterRepository campaignChapterRepository;

    @Override
    public LessonDTO createLesson(CreateLessonRequest request) {
        Lesson lesson = Lesson.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .orderIndex(request.getOrderIndex())
                .unlockedByDefault(request.isUnlockedByDefault())
                .build();

        return mapToDTO(lessonRepository.save(lesson));
    }

    @Override
    public List<LessonDTO> getAllLessons() {
        return lessonRepository.findAllByOrderByOrderIndexAsc()
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    @Override
    public LessonDTO getLessonById(Long id) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lezione non trovata"));

        return mapToDTO(lesson);
    }

    private LessonDTO mapToDTO(Lesson lesson) {
        QuizSummaryDTO quizSummary = quizRepository.findByLessonId(lesson.getId())
                .map(quiz -> QuizSummaryDTO.builder()
                        .id(quiz.getId())
                        .title(quiz.getTitle())
                        .build())
                .orElse(null);

        List<ChapterSummaryDTO> chapterSummaries = campaignChapterRepository
                .findByLessonId(lesson.getId())
                .stream()
                .map(chapter -> ChapterSummaryDTO.builder()
                        .id(chapter.getId())
                        .title(chapter.getTitle())
                        .build())
                .toList();

        return LessonDTO.builder()
                .id(lesson.getId())
                .title(lesson.getTitle())
                .content(lesson.getContent())
                .orderIndex(lesson.getOrderIndex())
                .unlockedByDefault(lesson.isUnlockedByDefault())
                .quiz(quizSummary)
                .chapters(chapterSummaries)
                .build();
    }

    @Override
    public List<UserLessonProgressDTO> getMyLessonProgress(String username) {

        User user = userService.getByUsername(username);
        List<Lesson> lessons = lessonRepository.findAllByOrderByOrderIndexAsc();

        for (Lesson lesson : lessons) {
            userLessonProgressRepository
                    .findByUserUsernameAndLessonId(username, lesson.getId())
                    .orElseGet(() -> {
                        UserLessonProgress progress = UserLessonProgress.builder()
                                .user(user)
                                .lesson(lesson)
                                .unlocked(lesson.isUnlockedByDefault())
                                .completed(false)
                                .build();

                        return userLessonProgressRepository.save(progress);
                    });
        }

        return userLessonProgressRepository.findByUserUsernameOrderByLessonOrderIndexAsc(username)
                .stream()
                .map(progress -> UserLessonProgressDTO.builder()
                        .lessonId(progress.getLesson().getId())
                        .title(progress.getLesson().getTitle())
                        .orderIndex(progress.getLesson().getOrderIndex())
                        .unlocked(progress.isUnlocked())
                        .completed(progress.isCompleted())
                        .completedAt(progress.getCompletedAt())
                        .build())
                .toList();
    }


    @Override
    public UserLessonProgressDTO completeLesson(Long lessonId, String username) {

        User user = userService.getByUsername(username);

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lezione non trovata"));

        UserLessonProgress progress = userLessonProgressRepository
                .findByUserUsernameAndLessonId(username, lessonId)
                .orElseGet(() -> UserLessonProgress.builder()
                        .user(user)
                        .lesson(lesson)
                        .unlocked(lesson.isUnlockedByDefault())
                        .completed(false)
                        .build());

        if (!progress.isUnlocked()) {
            throw new RuntimeException("Lezione non ancora sbloccata");
        }

        progress.setCompleted(true);
        progress.setCompletedAt(LocalDateTime.now());

        UserLessonProgress saved = userLessonProgressRepository.save(progress);

        // sblocca la lezione successiva
        List<Lesson> lessons = lessonRepository.findAllByOrderByOrderIndexAsc();

        lessons.stream()
                .filter(l -> l.getOrderIndex() == lesson.getOrderIndex() + 1)
                .findFirst()
                .ifPresent(nextLesson -> {
                    UserLessonProgress nextProgress = userLessonProgressRepository
                            .findByUserUsernameAndLessonId(username, nextLesson.getId())
                            .orElse(UserLessonProgress.builder()
                                    .user(user)
                                    .lesson(nextLesson)
                                    .completed(false)
                                    .build());

                    nextProgress.setUnlocked(true);
                    userLessonProgressRepository.save(nextProgress);
                });

        return UserLessonProgressDTO.builder()
                .lessonId(saved.getLesson().getId())
                .title(saved.getLesson().getTitle())
                .orderIndex(saved.getLesson().getOrderIndex())
                .unlocked(saved.isUnlocked())
                .completed(saved.isCompleted())
                .completedAt(saved.getCompletedAt())
                .build();
    }

    @Override
    public void completeLessonAfterQuiz(Long lessonId, String username) {

        User user = userService.getByUsername(username);

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lezione non trovata"));

        UserLessonProgress progress = userLessonProgressRepository
                .findByUserUsernameAndLessonId(username, lessonId)
                .orElseGet(() -> UserLessonProgress.builder()
                        .user(user)
                        .lesson(lesson)
                        .unlocked(true)
                        .completed(false)
                        .build());

        progress.setUnlocked(true);
        progress.setCompleted(true);
        progress.setCompletedAt(LocalDateTime.now());

        userLessonProgressRepository.save(progress);

        List<Lesson> lessons = lessonRepository.findAllByOrderByOrderIndexAsc();

        lessons.stream()
                .filter(l -> l.getOrderIndex() == lesson.getOrderIndex() + 1)
                .findFirst()
                .ifPresent(nextLesson -> {
                    UserLessonProgress nextProgress = userLessonProgressRepository
                            .findByUserUsernameAndLessonId(username, nextLesson.getId())
                            .orElse(UserLessonProgress.builder()
                                    .user(user)
                                    .lesson(nextLesson)
                                    .completed(false)
                                    .build());

                    nextProgress.setUnlocked(true);
                    userLessonProgressRepository.save(nextProgress);
                });
    }

    @Override
    public LessonDTO updateLesson(Long lessonId, UpdateLessonRequest request) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lezione non trovata."));

        lesson.setTitle(request.getTitle().trim());
        lesson.setContent(request.getContent().trim());
        lesson.setOrderIndex(request.getOrderIndex());
        lesson.setUnlockedByDefault(request.getUnlockedByDefault());

        Lesson updatedLesson = lessonRepository.save(lesson);

        return mapToDTO(updatedLesson);
    }

    @Override
    public void deleteLesson(Long lessonId) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Lezione non trovata."));

        if (quizRepository.findByLessonId(lessonId).isPresent()) {
            throw new RuntimeException(
                    "Non puoi eliminare questa lezione perché è collegata a un quiz. Elimina prima il quiz associato."
            );
        }

        if (!campaignChapterRepository.findByLessonId(lessonId).isEmpty()) {
            throw new RuntimeException(
                    "Non puoi eliminare questa lezione perché è collegata a uno o più capitoli. Rimuovi prima il collegamento dai capitoli."
            );
        }

        lessonRepository.delete(lesson);
    }
}