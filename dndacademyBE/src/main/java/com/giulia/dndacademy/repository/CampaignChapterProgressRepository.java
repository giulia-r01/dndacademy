package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.CampaignChapterProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CampaignChapterProgressRepository
        extends JpaRepository<CampaignChapterProgress, Long> {

    boolean existsByChapterId(Long chapterId);

    long countByUserIdAndChapterCampaignIdAndCompletedTrue(Long userId, Long campaignId);

    List<CampaignChapterProgress> findByUserIdAndChapterCampaignIdOrderByChapterOrderIndexAsc(
            Long userId,
            Long campaignId
    );

    Optional<CampaignChapterProgress> findByUserIdAndChapterId(
            Long userId,
            Long chapterId
    );

    boolean existsByUserIdAndChapterId(
            Long userId,
            Long chapterId
    );
}
