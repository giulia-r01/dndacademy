package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findAllByOrderByOrderIndexAsc();
}