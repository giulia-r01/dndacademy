package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.Combat;
import com.giulia.dndacademy.model.enumerations.CombatOutcome;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CombatRepository extends JpaRepository<Combat, Long> {
    boolean existsByChapterIdAndUserIdAndCompletedTrueAndOutcome(Long chapterId, Long userId, CombatOutcome outcome);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Combat c where c.id = :id")
    Optional<Combat> findLockedById(@Param("id") Long id);

    List<Combat> findByCampaignId(Long campaignId);

    boolean existsByEncounterId(Long encounterId);
}