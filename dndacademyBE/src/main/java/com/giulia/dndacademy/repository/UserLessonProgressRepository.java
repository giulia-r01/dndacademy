package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.UserLessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserLessonProgressRepository extends JpaRepository<UserLessonProgress, Long> {

    List<UserLessonProgress> findByUserUsernameOrderByLessonOrderIndexAsc(String username);

    Optional<UserLessonProgress> findByUserUsernameAndLessonId(String username, Long lessonId);
}