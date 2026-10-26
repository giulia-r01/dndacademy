package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.Encounter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EncounterRepository extends JpaRepository<Encounter, Long> {

    List<Encounter> findByChapterId(Long chapterId);

    Optional<Encounter> findFirstByChapterIdOrderByIdAsc(Long chapterId);

    boolean existsByChapterId(Long chapterId);
}