package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.CampaignChapter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampaignChapterRepository extends JpaRepository<CampaignChapter, Long> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select c from CampaignChapter c where c.id = :id")
    java.util.Optional<CampaignChapter> findLockedById(@org.springframework.data.repository.query.Param("id") Long id);

    List<CampaignChapter> findByCampaignIdOrderByOrderIndexAsc(Long campaignId);

    boolean existsByCampaignIdAndOrderIndex(Long campaignId, int orderIndex);

    boolean existsByCampaignId(Long campaignId);

    long countByCampaignId(Long campaignId);

    boolean existsByLessonId(Long lessonId);

    long countByLessonId(Long lessonId);

    List<CampaignChapter> findByLessonId(Long lessonId);

    boolean existsByRewardBadgeId(Long badgeId);

    boolean existsByQuizId(Long quizId);
}