package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.Combat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CombatRepository extends JpaRepository<Combat, Long> {

    List<Combat> findByCampaignId(Long campaignId);

    List<Combat> findByChapterId(Long chapterId);

    Optional<Combat> findTopByChapterIdOrderByIdDesc(Long chapterId);

    boolean existsByChapterIdAndCompletedTrue(Long chapterId);
}