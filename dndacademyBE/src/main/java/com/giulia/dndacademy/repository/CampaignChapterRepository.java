package com.giulia.dndacademy.repository;

import com.giulia.dndacademy.model.CampaignChapter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampaignChapterRepository extends JpaRepository<CampaignChapter, Long> {

    List<CampaignChapter> findByCampaignIdOrderByOrderIndexAsc(Long campaignId);

    boolean existsByCampaignIdAndOrderIndex(Long campaignId, int orderIndex);

    boolean existsByCampaignId(Long campaignId);

    long countByCampaignId(Long campaignId);
}